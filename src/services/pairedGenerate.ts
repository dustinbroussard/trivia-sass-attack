import { ZodError } from 'zod';
import { generateQuestion } from '@/services/aiTrivia';
import { TriviaQuestion, TriviaQuestionSchema } from '@/types/trivia';
import { RoundMeta, TriviaPair } from '@/types/rounds';

const TriviaQuestionValidator = TriviaQuestionSchema; // alias for clarity
const MAX_ATTEMPTS_PER_ROLE = 3;

function diffTokenForMeta(meta: RoundMeta): string {
  return `${meta.roundSeed}:${meta.category}:${meta.difficulty}`;
}

async function generateForRole(meta: RoundMeta, role: 'A' | 'B', diffToken: string): Promise<TriviaQuestion> {
  let attempts = 0;
  let lastError: unknown = null;
  while (attempts < MAX_ATTEMPTS_PER_ROLE) {
    attempts += 1;
    try {
      const question = await generateQuestion({
        category: meta.category,
        difficulty: meta.difficulty,
        tone: meta.tone,
        seed: meta.roundSeed,
        roleDiscriminator: role,
        diffToken,
      });
      const parsed = TriviaQuestionValidator.parse(question);
      return parsed;
    } catch (err) {
      lastError = err;
      if (!(err instanceof ZodError) && attempts >= MAX_ATTEMPTS_PER_ROLE) {
        break;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function generatePairedRound(meta: RoundMeta): Promise<TriviaPair> {
  const diffToken = diffTokenForMeta(meta);
  const [A, B] = await Promise.all([
    generateForRole(meta, 'A', diffToken),
    generateForRole(meta, 'B', diffToken),
  ]);
  return { A, B };
}
