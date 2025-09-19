import { nanoid } from 'nanoid';
import { chat } from '@/lib/openrouter';
import {
  TriviaQuestionSchema,
  TriviaQuestion,
  TriviaCategory,
  Tone,
  PersonalityFlags,
  TriviaCategories,
} from '@/types/trivia';

function readEnv(key: string): string | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env && key in import.meta.env) {
    return import.meta.env[key] as string | undefined;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

const DEFAULT_MODEL = 'google/gemini-2.0-flash-001';

function resolveModel(): string {
  return readEnv('VITE_OPENROUTER_MODEL') || readEnv('OPENROUTER_MODEL') || DEFAULT_MODEL;
}

export type RoleDiscriminator = 'A' | 'B';

type GenerateParams = {
  category: TriviaCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  seed?: string;
  tone?: Tone;
  flags?: Partial<PersonalityFlags>;
  roleDiscriminator?: RoleDiscriminator;
  diffToken?: string;
};

type ResolvedParams = {
  category: TriviaCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  seed: string;
  tone: Tone;
  flags: PersonalityFlags;
  roleDiscriminator: RoleDiscriminator;
  diffToken: string;
};

const DEFAULT_FLAGS: PersonalityFlags = {
  pg13Snark: true,
  noPolitics: true,
  allowLightInnuendo: false,
  keepKind: true,
};

// Simple per-category 1 rps rate limiter
const lastCall: Map<string, number> = new Map();

function enforceRateLimit(category: string) {
  const now = Date.now();
  const last = lastCall.get(category) || 0;
  if (now - last < 1000) {
    throw new Error('Rate limit: try again in a moment');
  }
  lastCall.set(category, now);
}

// Local cache in localStorage
function cacheKey(p: ResolvedParams) {
  return `tsa.cache::${p.category}|${p.difficulty}|${p.seed}|${p.roleDiscriminator}|${p.diffToken}`;
}

function saveCache(p: ResolvedParams, q: TriviaQuestion) {
  try {
    localStorage.setItem(cacheKey(p), JSON.stringify(q));
  } catch (err) {
    if (import.meta.env.DEV) console.debug('[aiTrivia] cache save skipped', err);
  }
}

function loadCache(p: ResolvedParams): TriviaQuestion | null {
  try {
    const raw = localStorage.getItem(cacheKey(p));
    if (!raw) return null;
    return JSON.parse(raw) as TriviaQuestion;
  } catch {
    return null;
  }
}

export function systemPrompt(flags: PersonalityFlags, tone: Tone | undefined) {
  const toneText = tone ? `Tone: ${tone}.` : 'Tone: snarky but kind.';
  const constraints: string[] = [
    'You are a trivia writer blended with a late-night monologue writer.',
    'You output strictly JSON and never include prose outside the JSON.',
    'No slurs, no targeted harassment, no punching down.',
    'Stay playful, PG-13. Keep it kind and witty.',
    'Avoid copyrighted one-line quotes as answers; paraphrase instead.',
    'No explicit sexual content. No medical or legal advice.',
  ];
  if (flags.noPolitics) constraints.push('Avoid modern political punditry or partisan content.');
  if (!flags.allowLightInnuendo) constraints.push('Avoid sexual innuendo.');
  return [constraints.join(' '), toneText, 'Output must be valid JSON only.'].join(' ');
}

export function userPrompt(p: ResolvedParams, schemaExample: string, stricter = false) {
  const fairnessLine = `ROLE: ${p.roleDiscriminator}. DIFF_TOKEN: ${p.diffToken}. Produce questions of equivalent difficulty/style for roles A/B using the same diffToken; do NOT reuse the same fact.`;
  const seedLine = `SEED: ${p.seed}. Use this to choose facts and phrasing deterministically. Include "seedEcho" with the same value in the JSON.`;
  const rules = [
    `Category: ${p.category}. Difficulty: ${p.difficulty}.`,
    'Exactly 4 options. Exactly one correctIndex in 0..3.',
    'Quips are one-liners. They must reference the chosen option text implicitly, not the player.',
    'Return only JSON. No backticks, no commentary.',
  ];
  if (stricter) {
    rules.push('Absolutely no text outside JSON. If unsure, output the JSON schema shape verbatim.');
  }
  return [fairnessLine, seedLine, rules.join('\n'), 'Schema example:', schemaExample].join('\n');
}

function schemaExample(): string {
  return JSON.stringify({
    category: 'science',
    difficulty: 'easy',
    seedEcho: 'abc123',
    question: 'What gas do plants absorb during photosynthesis?',
    options: ['Oxygen', 'Hydrogen', 'Carbon Dioxide', 'Nitrogen'],
    correctIndex: 2,
    explanation: 'Plants absorb carbon dioxide and release oxygen during photosynthesis.',
    quips: {
      correct: "Photosynthetic perfection.",
      incorrect: "That pick didn’t leaf you looking smart.",
    },
  }, null, 2);
}

export function passesContentRules(trivia: TriviaQuestion, flags: PersonalityFlags): boolean {
  const text = [
    trivia.question,
    ...trivia.options,
    trivia.explanation,
    trivia.quips.correct,
    trivia.quips.incorrect,
  ].join(' ').toLowerCase();
  const banned = [
    // slurs/harassment placeholders; keep generic
    'kill yourself', 'nazi', 'lynch',
  ];
  if (banned.some(w => text.includes(w))) return false;
  // crude filters
  if (!flags.allowLightInnuendo) {
    if (/(sex|porn|explicit)/.test(text)) return false;
  }
  if (/(diagnose|prescribe|lawsuit|legal advice|medical advice)/.test(text)) return false;
  if (/(graphic violence|gore)/.test(text)) return false;
  return true;
}

export async function generateQuestion(params: GenerateParams): Promise<TriviaQuestion> {
  const seed = params.seed || nanoid();
  const diffToken = params.diffToken || seed;
  const p: ResolvedParams = {
    tone: params.tone || 'snark',
    seed,
    flags: { ...DEFAULT_FLAGS, ...(params.flags || {}) },
    category: params.category,
    difficulty: params.difficulty,
    roleDiscriminator: params.roleDiscriminator || 'A',
    diffToken,
  };

  enforceRateLimit(p.category);

  // cache first
  const cached = loadCache(p);
  if (cached) return cached;

  const sys = systemPrompt(p.flags, p.tone);
  const example = schemaExample();
  const makeUser = (strict = false) => userPrompt(p, example, strict);

  let lastErr: unknown = null;
  let attempts = 0;
  const maxAttempts = 3; // validation retries
  const maxContentRetries = 2;
  let contentRetries = 0;

  while (attempts < maxAttempts) {
    attempts++;
    const response = await chat({
      model: resolveModel(),
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: makeUser(attempts > 1) },
      ],
      temperature: 0.7,
    });

    let text = response?.choices?.[0]?.message?.content || '';
    text = text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```[a-zA-Z]*\n/, '').replace(/```\s*$/, '');
    }

    try {
      const parsed = JSON.parse(text);
      const result = TriviaQuestionSchema.safeParse(parsed);
      if (!result.success) {
        lastErr = result.error;
        continue;
      }
      const trivia = result.data;
      // seed echo check
      if (trivia.seedEcho !== p.seed) {
        if (attempts < maxAttempts) continue; // one more try
        throw new Error('Seed echo mismatch');
      }
      // content
      if (!passesContentRules(trivia, p.flags)) {
        if (contentRetries < maxContentRetries) {
          contentRetries++;
          // append stricter reminder and retry
          const stricterSys = sys + ' Reminder: You violated content constraints; rewrite within PG-13 and kindness rules.';
          const response2 = await chat({
            model: MODEL,
            messages: [
              { role: 'system', content: stricterSys },
              { role: 'user', content: makeUser(true) },
            ],
            temperature: 0.5,
          });
          text = (response2?.choices?.[0]?.message?.content || '').trim();
          if (text.startsWith('```')) {
            text = text.replace(/^```[a-zA-Z]*\n/, '').replace(/```\s*$/, '');
          }
          const parsed2 = JSON.parse(text);
          const v2 = TriviaQuestionSchema.parse(parsed2);
          if (!passesContentRules(v2, p.flags)) throw new Error('Content filter rejection after retry');
          saveCache(p, v2);
          if (import.meta.env.DEV) console.info('[aiTrivia] Regeneration due to content filter');
          return v2;
        }
        throw new Error('Content filter rejection');
      }

      saveCache(p, trivia);
      return trivia;
    } catch (e) {
      lastErr = e;
      continue;
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

