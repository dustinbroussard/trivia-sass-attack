import { generateQuestion } from '@/services/aiTrivia';
import { putMany } from '@/services/library';
import type { TriviaCategory, Tone } from '@/types/trivia';
import type { QuestionDocInput } from '@/types/library';
import { upsertMany as upsertManyToCloud } from '@/services/libraryCloud';

export interface FillOptions {
  category: TriviaCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  tone: Tone;
  amount: number;
  model?: string;
  delayMs?: number;
  syncToCloud?: boolean;
}

export interface FillSummary {
  requested: number;
  processed: number;
  inserted: number;
  duplicates: number;
  errors: number;
  cancelled: boolean;
}

let cancelRequested = false;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function cancelFill(): void {
  cancelRequested = true;
}

export async function startFill(options: FillOptions): Promise<FillSummary> {
  cancelRequested = false;
  const summary: FillSummary = {
    requested: options.amount,
    processed: 0,
    inserted: 0,
    duplicates: 0,
    errors: 0,
    cancelled: false,
  };
  const delay = options.delayMs ?? 1200;

  for (let i = 0; i < options.amount; i += 1) {
    if (cancelRequested) break;
    try {
      const question = await generateQuestion({
        category: options.category,
        difficulty: options.difficulty,
        tone: options.tone,
      });
      const doc: QuestionDocInput = {
        ...question,
        tone: options.tone,
        source: 'generated',
      };
      const localResult = await putMany([doc]);
      summary.inserted += localResult.inserted;
      summary.duplicates += localResult.duplicates;
      if (options.syncToCloud && localResult.inserted > 0) {
        try {
          await upsertManyToCloud([doc]);
        } catch (cloudErr) {
          console.warn('[fillQueue] cloud sync failed', cloudErr);
        }
      }
    } catch (err) {
      console.error('[fillQueue] generation error', err);
      summary.errors += 1;
    }
    summary.processed += 1;
    if (cancelRequested) break;
    if (delay > 0 && i < options.amount - 1) {
      await sleep(delay);
    }
  }

  summary.cancelled = cancelRequested;
  cancelRequested = false;
  return summary;
}
