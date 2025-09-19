import { z } from 'zod';
import { generateQuestion } from '@/services/aiTrivia';
import { TriviaQuestion, TriviaQuestionSchema, TriviaCategory, Tone } from '@/types/trivia';

export async function generatePack(params: { count: number; category: TriviaCategory; difficulty: 'easy'|'medium'|'hard'; tone: Tone; seedBase?: string }) : Promise<TriviaQuestion[]> {
  const out: TriviaQuestion[] = [];
  const base = params.seedBase || '';
  for (let i = 0; i < params.count; i++) {
    // stagger to respect 1 rps per category
    if (i > 0) await new Promise(r => setTimeout(r, 1100));
    const seed = base ? `${base}-${i+1}` : undefined;
    const q = await generateQuestion({ category: params.category, difficulty: params.difficulty, tone: params.tone, seed });
    out.push(q);
  }
  return out;
}

export function exportPack(questions: TriviaQuestion[], meta?: Record<string, unknown>): string {
  const payload = {
    createdAt: new Date().toISOString(),
    count: questions.length,
    settingsHint: Array.from(new Set(questions.map(q => `${q.category}|${q.difficulty}`))),
    items: questions,
    ...(meta || {}),
  };
  return JSON.stringify(payload, null, 2);
}

export function importPack(text: string): TriviaQuestion[] {
  const raw = JSON.parse(text);
  const arr = z.object({ items: z.array(TriviaQuestionSchema) }).parse(raw).items;
  try { localStorage.setItem('tsa.pack.last', JSON.stringify(arr)); } catch {}
  return arr;
}

