import { nanoid } from 'nanoid';
import { QuestionDoc, QuestionDocSchema, QuestionDocInput } from '@/types/library';
import type { TriviaCategory, Tone } from '@/types/trivia';
import { generateQuestion } from '@/services/aiTrivia';
import { computeStemHash, putMany } from '@/services/library';

interface PackMetadata {
  createdAt: string;
  counts: {
    byCategory: Record<string, number>;
    byDifficulty: Record<'easy' | 'medium' | 'hard', number>;
  };
}

function buildCounts(questions: QuestionDoc[]): PackMetadata['counts'] {
  const byCategory: Record<string, number> = {};
  const byDifficulty: Record<'easy' | 'medium' | 'hard', number> = {
    easy: 0,
    medium: 0,
    hard: 0,
  };
  for (const q of questions) {
    byCategory[q.category] = (byCategory[q.category] || 0) + 1;
    byDifficulty[q.difficulty] += 1;
  }
  return { byCategory, byDifficulty };
}

export async function generatePack(params: {
  count: number;
  category: TriviaCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  tone: Tone;
  seedBase?: string;
}): Promise<QuestionDoc[]> {
  const out: QuestionDoc[] = [];
  const base = params.seedBase || '';
  for (let i = 0; i < params.count; i += 1) {
    if (i > 0) await new Promise(resolve => setTimeout(resolve, 1100));
    const seed = base ? `${base}-${i + 1}` : undefined;
    const q = await generateQuestion({
      category: params.category,
      difficulty: params.difficulty,
      tone: params.tone,
      seed,
    });
    const doc: QuestionDoc = {
      ...q,
      id: `${params.category}-${nanoid()}`,
      stemHash: await computeStemHash(q),
      tone: params.tone,
      createdAt: Date.now(),
      source: 'generated',
      usedAt: null,
    };
    out.push(doc);
  }
  return out;
}

export function exportPack(questions: QuestionDoc[], meta?: Record<string, unknown>): string {
  const payload = {
    createdAt: new Date().toISOString(),
    counts: buildCounts(questions),
    items: questions,
    ...(meta || {}),
  } satisfies PackMetadata & Record<string, unknown> & { items: QuestionDoc[] };
  return JSON.stringify(payload, null, 2);
}

export async function importPack(json: string): Promise<{ inserted: number; duplicates: number; total: number }> {
  const parsed = JSON.parse(json);
  const itemsRaw = Array.isArray(parsed) ? parsed : parsed.items;
  const items = QuestionDocSchema.array().parse(itemsRaw);
  const inputs: QuestionDocInput[] = items.map(item => ({
    ...item,
    stemHash: undefined,
    id: item.id,
    source: item.source || 'imported',
  }));
  const result = await putMany(inputs);
  return { ...result, total: items.length };
}

