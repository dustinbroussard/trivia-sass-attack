import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as openrouter from '@/lib/openrouter';
import { generateQuestion } from './aiTrivia';

vi.mock('@/lib/openrouter', () => ({
  chat: vi.fn(),
}));

const mockChat = openrouter as unknown as { chat: ReturnType<typeof vi.fn> };

describe('aiTrivia.generateQuestion', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  it('returns a validated object and caches it', async () => {
    const payload = {
      category: 'science',
      difficulty: 'easy',
      seedEcho: 'test-seed',
      question: 'What gas do plants absorb during photosynthesis?',
      options: ['Oxygen', 'Hydrogen', 'Carbon Dioxide', 'Nitrogen'],
      correctIndex: 2,
      explanation: 'Plants absorb carbon dioxide and release oxygen during photosynthesis.',
      quips: { correct: 'Photosynthetic perfection.', incorrect: 'Leaf that choice behind.' },
    };
    mockChat.chat.mockResolvedValue({
      id: 'x',
      choices: [{ index: 0, message: { role: 'assistant', content: JSON.stringify(payload) } }],
      model: 'test-model',
    });

    const out = await generateQuestion({ category: 'science', difficulty: 'easy', seed: 'test-seed' });
    expect(out.seedEcho).toBe('test-seed');
    const key = `tsa.cache::science|easy|test-seed|A|test-seed`;
    expect(localStorage.getItem(key)).toBeTruthy();
  });
});

