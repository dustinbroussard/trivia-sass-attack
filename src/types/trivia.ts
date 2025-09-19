import { z } from 'zod';

export const TriviaCategories = [
  'history',
  'science',
  'arts',
  'pop_culture',
  'sports',
  'geography',
  'literature',
  'technology',
] as const;

export type TriviaCategory = typeof TriviaCategories[number];

export const TriviaQuestionSchema = z.object({
  category: z.enum(TriviaCategories),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  seedEcho: z.string().min(1),
  question: z.string().min(6).max(280),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(6).max(300),
  quips: z.object({
    correct: z.string().min(2).max(160),
    incorrect: z.string().min(2).max(160),
  }),
});

export type TriviaQuestion = z.infer<typeof TriviaQuestionSchema>;

export type Tone = 'snark' | 'deadpan' | 'professor' | 'roast-lite';

export interface PersonalityFlags {
  pg13Snark: boolean; // default on
  noPolitics: boolean; // default on
  allowLightInnuendo: boolean; // default off
  keepKind: true; // always true, enforced
}

