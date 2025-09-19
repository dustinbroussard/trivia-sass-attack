import { nanoid } from 'nanoid';
import { getDB } from '@/lib/db';
import { sha256 } from '@/lib/hash';
import type { TriviaCategory } from '@/types/trivia';
import type { QuestionDoc, QuestionDocInput } from '@/types/library';

export function buildHashPayload(doc: QuestionDocInput): string {
  const base = [
    doc.category,
    doc.difficulty,
    doc.question.trim().toLowerCase(),
    doc.options.map(option => option.trim().toLowerCase()).join('|'),
    doc.explanation.trim().toLowerCase(),
  ];
  return base.join('::');
}

export async function computeStemHash(doc: QuestionDocInput): Promise<string> {
  return sha256(buildHashPayload(doc));
}

export async function ensureUniqueByHash(
  doc: QuestionDocInput,
): Promise<{ doc: QuestionDoc; duplicate: boolean }> {
  const db = await getDB();
  const stemHash = doc.stemHash || (await computeStemHash(doc));
  const existing = await db.getFromIndex('questions', 'by_hash', stemHash);
  if (existing) {
    return { doc: existing, duplicate: true };
  }
  const enriched: QuestionDoc = {
    ...doc,
    id: doc.id || nanoid(),
    stemHash,
    createdAt: doc.createdAt || Date.now(),
    source: doc.source || 'generated',
    usedAt: doc.usedAt ?? null,
  };
  return { doc: enriched, duplicate: false };
}

export async function putMany(
  docs: QuestionDocInput[],
): Promise<{ inserted: number; duplicates: number }> {
  if (!docs.length) return { inserted: 0, duplicates: 0 };
  const db = await getDB();
  const tx = db.transaction('questions', 'readwrite');
  let inserted = 0;
  let duplicates = 0;
  for (const candidate of docs) {
    const { doc, duplicate } = await ensureUniqueByHash(candidate);
    if (duplicate) {
      duplicates += 1;
      continue;
    }
    await tx.store.put(doc);
    inserted += 1;
  }
  await tx.done;
  return { inserted, duplicates };
}

export async function drawOne(params: {
  category: TriviaCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  excludeIds?: string[];
}): Promise<QuestionDoc | null> {
  const db = await getDB();
  const exclude = new Set(params.excludeIds || []);
  const tx = db.transaction('questions', 'readonly');
  const index = tx.store.index('by_cat_diff');
  const filtered = (await index.getAll([params.category, params.difficulty])).filter(
    doc => !exclude.has(doc.id) && !doc.usedAt,
  );

  const fallbackPool =
    filtered.length > 0
      ? filtered
      : (await tx.store.index('by_category').getAll(params.category)).filter(
          doc => !exclude.has(doc.id) && !doc.usedAt,
        );

  await tx.done;

  if (!fallbackPool.length) return null;
  const chosen = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
  return chosen;
}

export async function markUsed(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('questions', 'readwrite');
  const existing = await tx.store.get(id);
  if (existing) {
    existing.usedAt = Date.now();
    await tx.store.put(existing);
  }
  await tx.done;
}

export async function count(params?: {
  category?: TriviaCategory;
  difficulty?: 'easy' | 'medium' | 'hard';
}): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('questions', 'readonly');
  if (params?.category && params?.difficulty) {
    const total = await tx.store.index('by_cat_diff').count([
      params.category,
      params.difficulty,
    ]);
    await tx.done;
    return total;
  }
  if (params?.category) {
    const total = await tx.store.index('by_category').count(params.category);
    await tx.done;
    return total;
  }
  const total = await tx.store.count();
  await tx.done;
  return total;
}

export async function list(params?: {
  category?: TriviaCategory;
  difficulty?: 'easy' | 'medium' | 'hard';
  limit?: number;
  offset?: number;
}): Promise<QuestionDoc[]> {
  const db = await getDB();
  const tx = db.transaction('questions', 'readonly');
  let results: QuestionDoc[] = [];
  if (params?.category && params?.difficulty) {
    results = await tx.store.index('by_cat_diff').getAll([
      params.category,
      params.difficulty,
    ]);
  } else if (params?.category) {
    results = await tx.store.index('by_category').getAll(params.category);
  } else {
    results = await tx.store.getAll();
  }
  await tx.done;
  const offset = params?.offset ?? 0;
  const limit = params?.limit ?? results.length;
  return results.slice(offset, offset + limit);
}
