import { Tone, TriviaCategory } from '@/types/trivia';

export function quipFor({ correct, chosenIndex, category, tone, optionText }: { correct: boolean; chosenIndex: number; category: TriviaCategory; tone: Tone; optionText?: string }): string {
  const opt = optionText ? `"${optionText}"` : `option ${chosenIndex + 1}`;
  const base = correct
    ? [
        `Clean hit on ${opt}.`,
        `Right on the money with ${opt}.`,
        `Nailed it — ${opt} was the move.`,
      ]
    : [
        `Not ${opt}. Happens to the best of us.`,
        `${opt}? Bold. Not correct though.`,
        `Close, but ${opt} wasn’t it.`,
      ];

  const byTone: Record<Tone, string[]> = {
    'snark': correct ? [
      `Look at you, ${opt} savant.`,
      `Flexing knowledge with ${opt}.`,
    ] : [
      `${opt}? Respect the chaos, not the answer.`,
      `Spicy choice with ${opt}. Spicier nope.`,
    ],
    'deadpan': correct ? [
      `${opt}. Correct. Minimal applause.`,
    ] : [
      `${opt}. Incorrect. Proceed.`,
    ],
    'professor': correct ? [
      `Indeed, ${opt}. Textbook answer.`,
    ] : [
      `${opt} is a common misconception.`,
    ],
    'roast-lite': correct ? [
      `Okay brainiac, ${opt} was obvious.`,
    ] : [
      `${opt}? I admire the confidence.`,
    ],
  };

  const pool = base.concat(byTone[tone]);
  return pool[Math.floor(Math.random() * pool.length)];
}

