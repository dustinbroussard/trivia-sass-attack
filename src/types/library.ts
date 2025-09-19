import { z } from 'zod';
import { TriviaQuestion, TriviaQuestionSchema, TriviaCategory, Tone, ToneValues } from '@/types/trivia';

export interface QuestionDoc extends TriviaQuestion {
  id: string;
  stemHash: string;
  tone?: Tone;
  createdAt: number;
  source?: 'library' | 'generated' | 'imported' | 'cloud' | string;
  usedAt?: number | null;
}

export const QuestionDocSchema = TriviaQuestionSchema.extend({
  id: z.string().min(1),
  stemHash: z.string().min(1),
  tone: z.optional(z.enum(ToneValues)),
  createdAt: z.number().nonnegative(),
  source: z.optional(z.string()),
  usedAt: z.optional(z.number().nullable()),
});

export type QuestionDocInput = Omit<QuestionDoc, 'id' | 'stemHash' | 'createdAt' | 'source' | 'usedAt'> & {
  id?: string;
  stemHash?: string;
  createdAt?: number;
  source?: QuestionDoc['source'];
  usedAt?: number | null;
};

export interface QuestionDocCounts {
  total: number;
  byCategory: Record<TriviaCategory, number>;
  byDifficulty: Record<QuestionDoc['difficulty'], number>;
}
