
export type Category = 'History' | 'Science' | 'Pop Culture' | 'Art & Music' | 'Sports' | 'Random';

export interface TriviaQuestion {
  id: string;
  category: string;
  question: string;
  choices: string[];
  answer_index: number;
  correct_quip: string;
  wrong_answer_quips: Record<string, string>;
  used: boolean;
}

export interface QuestionBank {
  [category: string]: TriviaQuestion[];
}

export interface GameStats {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  longestStreak: number;
  categoriesCompleted: number;
  sessionTime: number;
}

export interface Player {
  id: string;
  name: string;
  completedCategories: Category[];
  streak: number;
  score: number;
  isHost?: boolean;
}

export interface GameState {
  id: string;
  status: 'waiting' | 'active' | 'completed';
  currentTurn: string;
  players: Player[];
  winner?: string;
  gameMode: 'single' | 'multiplayer';
  questionBank: QuestionBank;
  currentQuestion?: TriviaQuestion;
  currentCategory?: Category;
}
