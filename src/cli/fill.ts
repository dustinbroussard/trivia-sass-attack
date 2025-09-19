#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { nanoid } from 'nanoid';

import { generateQuestion } from '../services/aiTrivia';
import { computeStemHash } from '../services/library';
import { TriviaQuestionSchema, TriviaCategories, type TriviaCategory, type Tone, ToneValues } from '../types/trivia';
import type { QuestionDoc } from '../types/library';

interface CLIOptions {
  category: TriviaCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  tone: Tone;
  amount: number;
  delayMs: number;
  model?: string;
}

function usage(message?: string): never {
  if (message) {
    console.error(message);
  }
  console.info(`Usage: fill --category <${TriviaCategories.join('|')}> --difficulty <easy|medium|hard> [--tone <${ToneValues.join('|')}>] [--amount <n>] [--delayMs <ms>] [--model <name>]`);
  process.exit(1);
}

function isCategory(value: string): value is TriviaCategory {
  return (TriviaCategories as readonly string[]).includes(value);
}

function isTone(value: string): value is Tone {
  return (ToneValues as readonly string[]).includes(value as Tone);
}

function parseArgs(argv: string[]): CLIOptions {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key.startsWith('--')) {
      const name = key.slice(2);
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        usage(`Missing value for --${name}`);
      }
      args[name] = value;
      i += 1;
    }
  }

  const categoryRaw = args.category;
  if (!categoryRaw || !isCategory(categoryRaw)) {
    usage('Missing or invalid --category');
  }

  const difficultyRaw = args.difficulty;
  if (!difficultyRaw || !['easy', 'medium', 'hard'].includes(difficultyRaw)) {
    usage('Missing or invalid --difficulty');
  }

  const toneRaw = args.tone ?? 'snark';
  if (!isTone(toneRaw)) {
    usage('Invalid --tone');
  }

  const amount = args.amount ? Number(args.amount) : 20;
  if (!Number.isFinite(amount) || amount <= 0) {
    usage('Invalid --amount');
  }

  const delayMs = args.delayMs ? Number(args.delayMs) : 1200;
  if (!Number.isFinite(delayMs) || delayMs < 0) {
    usage('Invalid --delayMs');
  }

  return {
    category: categoryRaw,
    difficulty: difficultyRaw as CLIOptions['difficulty'],
    tone: toneRaw,
    amount: Math.floor(amount),
    delayMs,
    model: args.model,
  };
}

async function loadDotEnv(): Promise<void> {
  const envPath = path.resolve(process.cwd(), '.env');
  try {
    const raw = await fs.readFile(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#')) continue;
      const [key, ...rest] = line.split('=');
      if (!key || !rest.length) continue;
      const value = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code !== 'ENOENT') {
      console.warn('[fill] unable to read .env file', err);
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await loadDotEnv();
  if (options.model) {
    process.env.VITE_OPENROUTER_MODEL = options.model;
  }

  const records: QuestionDoc[] = [];
  for (let i = 0; i < options.amount; i += 1) {
    const questionRaw = await generateQuestion({
      category: options.category,
      difficulty: options.difficulty,
      tone: options.tone,
    });
    const validated = TriviaQuestionSchema.parse(questionRaw);
    const doc: QuestionDoc = {
      ...validated,
      id: `${options.category}-${nanoid()}`,
      tone: options.tone,
      stemHash: await computeStemHash(validated),
      createdAt: Date.now(),
      source: 'cli',
      usedAt: null,
    };
    records.push(doc);
    if (options.delayMs > 0 && i < options.amount - 1) {
      await new Promise(resolve => setTimeout(resolve, options.delayMs));
    }
  }

  const outPath = path.resolve(process.cwd(), `pack-${Date.now()}.json`);
  const payload = {
    createdAt: new Date().toISOString(),
    options,
    items: records,
  };
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2));
  console.info(`Wrote ${records.length} questions to ${outPath}`);
}

main().catch(err => {
  console.error('[fill] generation failed', err);
  process.exit(1);
});
