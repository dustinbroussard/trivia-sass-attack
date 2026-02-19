
export const Categories = [
  'History',
  'Science',
  'Pop Culture',
  'Art & Music',
  'Sports',
  'Random',
] as const;

export type Category = typeof Categories[number];

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

export interface TriviaQuestion {
  id: string;
  category: Category;
  question: string;
  choices: string[];
  answer_index: number;
  correct_quip: string;
  wrong_answer_quips: Record<string, string>;
  used: boolean;
}

export type QuestionBank = {
  [K in Category]?: TriviaQuestion[];
};

export interface GameRow {
  id: string;
  code: string;
  status: 'waiting' | 'active' | 'completed';
  host_player_id: string | null;
  guest_player_id: string | null;
  current_turn_player_id: string | null;
  active_question_id: string | null;
  active_category: Category | null;
  turn_number: number;
  winner_player_id: string | null;
  allow_category_choice: boolean;
  created_at: string;
}

export interface GamePlayerRow {
  id: string;
  game_id: string;
  user_id: string;
  name: string;
  role: 'host' | 'guest';
  score: number;
  streak: number;
  categories_completed: Category[];
  created_at: string;
}

export interface GameQuestionPublic {
  id: string;
  game_id: string;
  category: Category;
  question_text: string;
  choices: string[];
  quip_correct: string;
  quip_wrong: string;
  created_at: string;
}

export interface SubmitAnswerResult {
  correct: boolean;
  quip: string;
  correctIndex?: number;
  nextTurnPlayerId: string | null;
  gameStatus: 'waiting' | 'active' | 'completed';
  winnerPlayerId: string | null;
  playerScore: number;
  playerStreak: number;
  categoriesCompleted: Category[];
  allowCategoryChoice: boolean;
}
