import { describe, it, expect } from 'vitest';
import { TriviaQuestionSchema } from './trivia';

describe('TriviaQuestionSchema', () => {
  it('parses a valid sample', () => {
    const sample = {
      category: 'science',
      difficulty: 'easy',
      seedEcho: 'seed123',
      question: 'What gas do plants absorb during photosynthesis?',
      options: ['Oxygen', 'Hydrogen', 'Carbon Dioxide', 'Nitrogen'],
      correctIndex: 2,
      explanation: 'Plants absorb CO2 and release O2 during photosynthesis.',
      quips: { correct: 'Photosynthetic perfection.', incorrect: 'Leaf that choice behind.' },
    };
    const out = TriviaQuestionSchema.parse(sample);
    expect(out.options.length).toBe(4);
    const uniqueCorrect = out.options[out.correctIndex];
    expect(typeof uniqueCorrect).toBe('string');
  });
});

