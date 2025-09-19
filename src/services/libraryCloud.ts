import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { QuestionDoc } from '@/types/library';
import type { TriviaCategory } from '@/types/trivia';

let client: SupabaseClient | null = null;

function resolveEnv(key: string): string | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env && key in import.meta.env) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

function getClient(): SupabaseClient | null {
  if (client) return client;
  const url = resolveEnv('VITE_SUPABASE_URL') || resolveEnv('SUPABASE_URL');
  const anonKey = resolveEnv('VITE_SUPABASE_ANON_KEY') || resolveEnv('SUPABASE_ANON_KEY');
  if (!url || !anonKey) {
    return null;
  }
  client = createClient(url, anonKey, { auth: { persistSession: false } });
  return client;
}

export async function upsertMany(docs: QuestionDoc[]): Promise<{ inserted: number; duplicates: number }> {
  if (!docs.length) {
    return { inserted: 0, duplicates: 0 };
  }
  const supabase = getClient();
  if (!supabase) {
    return { inserted: 0, duplicates: docs.length };
  }
  const { data, error } = await supabase
    .from('questions')
    .upsert(docs, { onConflict: 'stemHash', ignoreDuplicates: true })
    .select('id');
  if (error) {
    console.warn('[libraryCloud] upsert failed', error);
    return { inserted: 0, duplicates: docs.length };
  }
  const inserted = data?.length ?? 0;
  const duplicates = Math.max(0, docs.length - inserted);
  return { inserted, duplicates };
}

export async function fetchBatch(params: {
  category: TriviaCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  limit?: number;
  excludeHashes?: string[];
}): Promise<QuestionDoc[]> {
  const supabase = getClient();
  if (!supabase) return [];
  const limit = params.limit ?? 50;
  let query = supabase
    .from('questions')
    .select('*')
    .eq('category', params.category)
    .eq('difficulty', params.difficulty)
    .limit(limit);
  if (params.excludeHashes?.length) {
    query = query.not('stemHash', 'in', `(${params.excludeHashes.join(',')})`);
  }
  const { data, error } = await query;
  if (error) {
    console.warn('[libraryCloud] fetchBatch error', error);
    return [];
  }
  if (!data) return [];
  if (params.excludeHashes?.length) {
    const exclude = new Set(params.excludeHashes);
    return data.filter(item => !exclude.has(item.stemHash));
  }
  return data;
}
