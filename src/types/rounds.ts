import { TriviaCategory, TriviaQuestion, Tone } from '@/types/trivia';

export type RoundRole = 'A' | 'B';
export type RoundDifficulty = 'easy' | 'medium' | 'hard';

export type RoundType = 'normal' | 'binary_blitz' | 'speed_link' | 'final_attack';

export interface RoundMeta {
  roundId: string;
  roundSeed: string;
  category: TriviaCategory;
  difficulty: RoundDifficulty;
  tone?: Tone;
  type: RoundType;
}

export interface RoundDrawResult<A = unknown, B = unknown, Shared = unknown> {
  A?: A;
  B?: B;
  shared?: Shared;
}

export interface RoundScoringPayload {
  roundId: string;
  type: RoundType;
  submittedAt: number;
  [key: string]: unknown;
}

export interface RoundScoringResult {
  totals: Record<string, number>;
  breakdowns?: Record<string, Record<string, number>>;
  meta?: Record<string, unknown>;
}

export interface RoundDefinition {
  supportsPairing: boolean;
  needsPack: boolean;
  drawOrGenerate(meta: RoundMeta): Promise<RoundDrawResult>;
  score(payload: RoundScoringPayload): Promise<RoundScoringResult> | RoundScoringResult;
}

export type RoundRegistry = Record<RoundType, RoundDefinition>;

export interface TriviaPair {
  A: TriviaQuestion;
  B: TriviaQuestion;
}
