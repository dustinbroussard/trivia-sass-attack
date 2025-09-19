
import { TriviaQuestion, QuestionBank, Category } from '@/types/game';

// Mock question data based on your samples
const mockQuestions: QuestionBank = {
  'Science': [
    {
      id: "9d353a5b1db66eb06ca5c1f8512efedeb90adb591bded6a0e6e2b7e031b1295b",
      category: "Science",
      question: "What gas do plants absorb during photosynthesis?",
      choices: ["Oxygen", "Hydrogen", "Carbon Dioxide", "Nitrogen"],
      answer_index: 2,
      correct_quip: "Photosynthetic perfection! Your brain cells clearly aren't dormant.",
      wrong_answer_quips: {
        "0": "Oxygen? Plants exhale that, champ. Like you exhale disappointment.",
        "1": "Hydrogen? That's for blimps and bad decisions. Are you photosynthesizing stupidity?",
        "3": "Nitrogen? Your plants would be sobbing if you fed them that."
      },
      used: false
    },
    {
      id: "16e9a13e42100ac6114d3e6643a28be9b28994e6309b4e543e68add3bf8eb74e",
      category: "Science",
      question: "What particle has a negative charge?",
      choices: ["Proton", "Neutron", "Electron", "Quark"],
      answer_index: 2,
      correct_quip: "You must be positively charged about that correct answer!",
      wrong_answer_quips: {
        "0": "Proton? That's the opposite of helpful.",
        "1": "Neutron? Neutral much?",
        "3": "Quark? Cool word. Still wrong."
      },
      used: false
    }
  ],
  'History': [
    {
      id: "d7311f3f2e3eae38bf40e1bed1069c4a4d7785013db16194b1ebcab125025890",
      category: "History",
      question: "Who was the first president of the United States?",
      choices: ["Abraham Lincoln", "George Washington", "Thomas Jefferson", "John Adams"],
      answer_index: 1,
      correct_quip: "First and finest. Just like your answer.",
      wrong_answer_quips: {
        "0": "Lincoln? Wrong century, legend.",
        "2": "Jefferson? He wrote, didn't lead first.",
        "3": "Adams? Almost, but nope."
      },
      used: false
    },
    {
      id: "8b249fafc550c177f7d4e1a92f4d196c894c25507b777d84596c1bba6f42f2bb",
      category: "History",
      question: "In what year did World War II end?",
      choices: ["1942", "1945", "1939", "1950"],
      answer_index: 1,
      correct_quip: "Nice! You just won the war on ignorance.",
      wrong_answer_quips: {
        "0": "1942? That's mid-carnage, not the finale.",
        "2": "1939? That's the kickoff, not the credits.",
        "3": "1950? That was Korea, not Hitler's ending."
      },
      used: false
    }
  ],
  'Pop Culture': [
    {
      id: "pc1",
      category: "Pop Culture",
      question: "Which social media platform was originally called 'FaceMash'?",
      choices: ["Instagram", "Facebook", "Snapchat", "TikTok"],
      answer_index: 1,
      correct_quip: "Someone's been paying attention to tech history! 📱",
      wrong_answer_quips: {
        "0": "Instagram? That came way later, genius.",
        "2": "Snapchat? Wrong ghost story.",
        "3": "TikTok? You're about a decade off."
      },
      used: false
    }
  ],
  'Art & Music': [
    {
      id: "am1",
      category: "Art & Music",
      question: "Which artist painted 'The Starry Night'?",
      choices: ["Pablo Picasso", "Vincent van Gogh", "Claude Monet", "Salvador Dalí"],
      answer_index: 1,
      correct_quip: "You've got some culture in you after all! 🎨",
      wrong_answer_quips: {
        "0": "Picasso? Wrong artistic movement, buddy.",
        "2": "Monet? He did water lilies, not swirls.",
        "3": "Dalí? Too melty, not swirly enough."
      },
      used: false
    }
  ],
  'Sports': [
    {
      id: "sp1",
      category: "Sports",
      question: "How many rings are on the Olympic flag?",
      choices: ["4", "5", "6", "7"],
      answer_index: 1,
      correct_quip: "Olympic knowledge! Going for the gold! 🥇",
      wrong_answer_quips: {
        "0": "Four? Not enough rings for this circus.",
        "2": "Six? You're overthinking the symbolism.",
        "3": "Seven? This isn't a phone number."
      },
      used: false
    }
  ],
  'Random': [
    {
      id: "r1",
      category: "Random",
      question: "What's the most stolen food in the world?",
      choices: ["Bread", "Cheese", "Chocolate", "Bananas"],
      answer_index: 1,
      correct_quip: "You know your crime statistics! Suspicious... 🧀",
      wrong_answer_quips: {
        "0": "Bread? Too basic for crime.",
        "2": "Chocolate? Sweet guess, but nope.",
        "3": "Bananas? That's just monkey business."
      },
      used: false
    }
  ]
};

export class QuestionBankService {
  private questionBank: QuestionBank = {} as QuestionBank;
  // Track in-flight refills per category to avoid duplicate work and allow awaiting
  private pendingRefills: Map<Category, Promise<void>> = new Map();
  private apiKey: string | null = null;
  private failureState: Map<Category, { fails: number; cooldownUntil: number }> = new Map();
  private readonly FAIL_THRESHOLD = 3;
  private readonly COOLDOWN_MS = 60_000;

  constructor() {
    this.initializeWithMockData();
  }

  private initializeWithMockData() {
    // Deep clone mock data to avoid mutation
    this.questionBank = JSON.parse(JSON.stringify(mockQuestions));
  }

  setAPIKey(key: string | null | undefined) {
    this.apiKey = key?.trim() ? key.trim() : null;
  }

  private emitRefillEvent(
    category: Category,
    phase: 'start' | 'end' | 'error' | 'retry',
    extra?: Record<string, unknown>
  ) {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    const evt = new CustomEvent('qb:refill', {
      detail: { category, phase, ...(extra || {}) },
    });
    window.dispatchEvent(evt);
  }

  async getNextQuestion(category: Category): Promise<TriviaQuestion | null> {
    const categoryQuestions = this.questionBank[category] || [];
    const availableQuestions = categoryQuestions.filter(q => !q.used);
    
    if (availableQuestions.length === 0) {
      // Need to fetch more questions
      await this.refillCategory(category);
      const refilled = this.questionBank[category]?.filter(q => !q.used) || [];
      if (refilled.length === 0) return null;
      return this.selectRandomQuestion(refilled);
    }
    
    return this.selectRandomQuestion(availableQuestions);
  }

  private selectRandomQuestion(questions: TriviaQuestion[]): TriviaQuestion {
    const randomIndex = Math.floor(Math.random() * questions.length);
    const selectedQuestion = questions[randomIndex];
    selectedQuestion.used = true;
    return selectedQuestion;
  }

  private async refillCategory(category: Category): Promise<void> {
    // If a refill for this category is already in-flight, await it
    const existing = this.pendingRefills.get(category);
    if (existing) {
      await existing;
      return;
    }

    const now = Date.now();
    const state = this.failureState.get(category) || { fails: 0, cooldownUntil: 0 };
    const inCooldown = now < state.cooldownUntil;

    console.log(`🧠 Summoning trivia gods for ${category}...`);
    this.emitRefillEvent(category, 'start', inCooldown ? { cooldown: true } : undefined);

    // Try to fetch new questions if API key is provided; otherwise fall back to resetting used flags
    const refillPromise = (async () => {
      if (!this.apiKey || inCooldown) {
        const existing = this.questionBank[category] || [];
        existing.forEach((q) => (q.used = false));
        console.log(`✨ ${category} questions refilled from local bank!`);
        this.emitRefillEvent(category, 'end', { source: inCooldown ? 'local-cooldown' : 'local', cooldown: inCooldown });
        return;
      }

      try {
        const { items: fresh, model } = await this.fetchQuestionsFromOpenRouter(category, 6);
        if (fresh.length > 0) {
          // Replace or append questions and mark all as unused
          this.questionBank[category] = fresh.map((q) => ({ ...q, used: false }));
          console.log(`✨ ${category} questions fetched: ${fresh.length}`);
          // reset failure state on success
          this.failureState.set(category, { fails: 0, cooldownUntil: 0 });
          this.emitRefillEvent(category, 'end', { source: 'openrouter', model });
          return;
        }
      } catch (err) {
        console.warn('Question fetch failed, falling back to local reset:', err);
        this.emitRefillEvent(category, 'error', { error: String(err) });
        // bump failures and maybe activate cooldown
        const cur = this.failureState.get(category) || { fails: 0, cooldownUntil: 0 };
        const fails = cur.fails + 1;
        if (fails >= this.FAIL_THRESHOLD) {
          this.failureState.set(category, { fails: 0, cooldownUntil: Date.now() + this.COOLDOWN_MS });
        } else {
          this.failureState.set(category, { fails, cooldownUntil: cur.cooldownUntil });
        }
      }

      const fallback = this.questionBank[category] || [];
      fallback.forEach((q) => (q.used = false));
      console.log(`✨ ${category} questions refilled from local bank!`);
      this.emitRefillEvent(category, 'end', { source: 'local-fallback' });
    })();

    this.pendingRefills.set(category, refillPromise);
    try {
      await refillPromise;
    } finally {
      this.pendingRefills.delete(category);
    }
  }

  private async fetchQuestionsFromOpenRouter(category: Category, count: number): Promise<{ items: TriviaQuestion[]; model: string | null }> {
    type GeneratedQuestion = {
      question: string;
      choices: string[];
      correctIndex: number;
      wrongQuips: Record<string, string>;
      correctQuip: string;
    };
    // OpenRouter Chat Completions API
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const system = `You are a trivia generator. Output ONLY valid JSON matching this TypeScript type:
type Out = { questions: { question: string; choices: string[]; correctIndex: number; wrongQuips: Record<string,string>; correctQuip: string; }[] }`;
    const user = `Generate ${count} short, clear, family-friendly multiple-choice trivia questions for the category: ${category}.
Rules:
- Exactly 4 choices per question.
- correctIndex must be 0..3.
- wrongQuips must include keys '0','1','2','3' with snappy, humorous one-liners.
- correctQuip is a single upbeat one-liner.
- Do not include explanations.
Return JSON only.`;

    const models = [
      'openrouter/anthropic/claude-3-haiku',
      'openrouter/openai/gpt-4o-mini',
      'openrouter/auto',
    ];
    let lastErr: unknown = null;
    let content: string | undefined;
    let usedModel: string | null = null;

    for (const model of models) {
      try {
        const res = await this.postWithRetry(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            // Optional headers recommended by OpenRouter for browser requests
            'HTTP-Referer': (typeof window !== 'undefined' ? window.location.origin : ''),
            'X-Title': 'AFTG Trivia',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user },
            ],
            temperature: 0.7,
          }),
        }, (attempt, total) => {
          this.emitRefillEvent(category, 'retry', { attempt, total });
        });

        if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
        const data = await res.json();
        content = data?.choices?.[0]?.message?.content;
        if (!content || typeof content !== 'string') throw new Error('No content from model');
        usedModel = model;
        break;
      } catch (e) {
        lastErr = e;
        continue;
      }
    }

    if (!content) throw lastErr ?? new Error('Failed to generate questions');

    let jsonText = content.trim();
    // Strip code block fences if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```[a-zA-Z]*\n/, '').replace(/```\s*$/, '');
    }

    let parsed: { questions?: GeneratedQuestion[] };
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      // Try to extract JSON substring
      const start = jsonText.indexOf('{');
      const end = jsonText.lastIndexOf('}');
      if (start >= 0 && end > start) {
        parsed = JSON.parse(jsonText.slice(start, end + 1));
      } else throw e;
    }

    const out: GeneratedQuestion[] = Array.isArray(parsed?.questions) ? parsed.questions as GeneratedQuestion[] : [];
    const now = Date.now();
    const mapped: TriviaQuestion[] = out.slice(0, count).map((q: GeneratedQuestion, i: number) => {
      const choices = Array.isArray(q.choices) ? q.choices.slice(0, 4) : [];
      const correctIndex = Math.max(0, Math.min(3, Number(q.correctIndex ?? 0)));
      const wrongQuips = q.wrongQuips && typeof q.wrongQuips === 'object' ? q.wrongQuips : {};
      const ensureWrong = {
        '0': wrongQuips['0'] || 'Nope, not quite.',
        '1': wrongQuips['1'] || 'Nice try, still wrong.',
        '2': wrongQuips['2'] || 'Swing and a miss.',
        '3': wrongQuips['3'] || 'That answer tripped over itself.',
      } as Record<string, string>;

      return {
        id: `${category}_${now}_${i}`,
        category,
        question: String(q.question ?? 'Unknown question'),
        choices: choices.length === 4 ? choices : ['A', 'B', 'C', 'D'],
        answer_index: correctIndex,
        correct_quip: String(q.correctQuip ?? 'Boom! Nailed it.'),
        wrong_answer_quips: ensureWrong,
        used: false,
      } as TriviaQuestion;
    });

    return { items: mapped, model: usedModel };
  }

  private async postWithRetry(
    url: string,
    init: RequestInit,
    attempts = 3,
    baseDelayMs = 500,
    onRetry?: (attempt: number, total: number) => void,
  ): Promise<Response> {
    let lastError: unknown = null;
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetch(url, init);
        if (!res.ok) {
          // Retry on 429 or 5xx
          if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
            throw new Error(`HTTP ${res.status}`);
          }
        }
        return res;
      } catch (err) {
        lastError = err;
        if (i < attempts - 1) {
          const exp = baseDelayMs * Math.pow(2, i);
          const jitter = Math.random() * exp * 0.25; // up to +25% jitter
          const delay = Math.floor(exp + jitter);
          if (onRetry) onRetry(i + 2, attempts); // Next attempt number (1-based)
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw lastError;
      }
    }
    // Unreachable
    throw lastError as Error;
  }

  getStats(): { total: number; used: number; available: number } {
    const allQuestions = Object.values(this.questionBank).flat();
    const used = allQuestions.filter(q => q.used).length;
    return {
      total: allQuestions.length,
      used,
      available: allQuestions.length - used
    };
  }

  reset() {
    this.initializeWithMockData();
  }
}

export const questionBankService = new QuestionBankService();
