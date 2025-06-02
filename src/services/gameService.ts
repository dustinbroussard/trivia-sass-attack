
import { GameState, Player, Category, GameStats, TriviaQuestion } from '@/types/game';
import { questionBankService } from './questionBank';

export class GameService {
  private gameState: GameState | null = null;
  private gameStats: GameStats = this.initializeStats();

  constructor() {
    this.loadGameFromStorage();
  }

  private initializeStats(): GameStats {
    return {
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      longestStreak: 0,
      categoriesCompleted: 0,
      sessionTime: 0
    };
  }

  createSinglePlayerGame(playerName: string): GameState {
    const player: Player = {
      id: 'player1',
      name: playerName,
      completedCategories: [],
      streak: 0,
      score: 0
    };

    this.gameState = {
      id: `solo_${Date.now()}`,
      status: 'active',
      currentTurn: player.id,
      players: [player],
      gameMode: 'single',
      questionBank: {}
    };

    this.gameStats = this.initializeStats();
    this.saveGameToStorage();
    return this.gameState;
  }

  createMultiplayerGame(hostName: string, gameCode: string): GameState {
    const host: Player = {
      id: 'host',
      name: hostName,
      completedCategories: [],
      streak: 0,
      score: 0,
      isHost: true
    };

    this.gameState = {
      id: gameCode,
      status: 'waiting',
      currentTurn: host.id,
      players: [host],
      gameMode: 'multiplayer',
      questionBank: {}
    };

    this.saveGameToStorage();
    return this.gameState;
  }

  joinMultiplayerGame(playerName: string, gameCode: string): GameState | null {
    // In a real implementation, this would query Supabase
    // For now, simulate joining a mock game
    const player: Player = {
      id: 'player2',
      name: playerName,
      completedCategories: [],
      streak: 0,
      score: 0
    };

    if (this.gameState?.id === gameCode) {
      this.gameState.players.push(player);
      this.gameState.status = 'active';
      this.saveGameToStorage();
      return this.gameState;
    }

    return null;
  }

  async getNextQuestion(category?: Category): Promise<TriviaQuestion | null> {
    if (!this.gameState) return null;

    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer) return null;

    let selectedCategory = category;
    
    if (!selectedCategory) {
      // Random category selection from incomplete categories
      const categories: Category[] = ['History', 'Science', 'Pop Culture', 'Art & Music', 'Sports', 'Random'];
      const incompleteCategories = categories.filter(cat => 
        !currentPlayer.completedCategories.includes(cat)
      );
      
      if (incompleteCategories.length === 0) return null;
      
      selectedCategory = incompleteCategories[Math.floor(Math.random() * incompleteCategories.length)];
    }

    this.gameState.currentCategory = selectedCategory;
    const question = await questionBankService.getNextQuestion(selectedCategory);
    
    if (question) {
      this.gameState.currentQuestion = question;
      this.saveGameToStorage();
    }
    
    return question;
  }

  answerQuestion(answerIndex: number): { correct: boolean; quip: string } {
    if (!this.gameState?.currentQuestion) {
      return { correct: false, quip: "No question to answer!" };
    }

    const question = this.gameState.currentQuestion;
    const isCorrect = answerIndex === question.answer_index;
    const currentPlayer = this.getCurrentPlayer();

    if (!currentPlayer) {
      return { correct: false, quip: "No player found!" };
    }

    this.gameStats.totalQuestions++;

    if (isCorrect) {
      // Update player stats
      currentPlayer.score++;
      currentPlayer.streak++;
      this.gameStats.correctAnswers++;
      
      // Check if category is completed
      if (this.gameState.currentCategory && !currentPlayer.completedCategories.includes(this.gameState.currentCategory)) {
        currentPlayer.completedCategories.push(this.gameState.currentCategory);
        this.gameStats.categoriesCompleted++;
      }

      // Update longest streak
      if (currentPlayer.streak > this.gameStats.longestStreak) {
        this.gameStats.longestStreak = currentPlayer.streak;
      }

      // Check win condition
      if (currentPlayer.completedCategories.length === 6) {
        this.gameState.status = 'completed';
        this.gameState.winner = currentPlayer.id;
      }

      this.saveGameToStorage();
      return { correct: true, quip: question.correct_quip };
    } else {
      // Wrong answer - reset streak and end turn
      currentPlayer.streak = 0;
      
      if (this.gameState.gameMode === 'multiplayer') {
        this.switchTurns();
      }

      this.saveGameToStorage();
      const wrongQuip = question.wrong_answer_quips[answerIndex.toString()] || "Wrong! Try harder next time.";
      return { correct: false, quip: wrongQuip };
    }
  }

  canChooseCategory(): boolean {
    const currentPlayer = this.getCurrentPlayer();
    return currentPlayer ? currentPlayer.streak >= 3 : false;
  }

  getCurrentPlayer(): Player | null {
    if (!this.gameState) return null;
    return this.gameState.players.find(p => p.id === this.gameState!.currentTurn) || null;
  }

  private switchTurns(): void {
    if (!this.gameState || this.gameState.gameMode === 'single') return;
    
    const currentIndex = this.gameState.players.findIndex(p => p.id === this.gameState!.currentTurn);
    const nextIndex = (currentIndex + 1) % this.gameState.players.length;
    this.gameState.currentTurn = this.gameState.players[nextIndex].id;
  }

  getGameState(): GameState | null {
    return this.gameState;
  }

  getGameStats(): GameStats {
    this.gameStats.accuracy = this.gameStats.totalQuestions > 0 
      ? Math.round((this.gameStats.correctAnswers / this.gameStats.totalQuestions) * 100)
      : 0;
    return { ...this.gameStats };
  }

  resetGame(): void {
    this.gameState = null;
    this.gameStats = this.initializeStats();
    questionBankService.reset();
    localStorage.removeItem('aftg_game_state');
    localStorage.removeItem('aftg_game_stats');
  }

  private saveGameToStorage(): void {
    if (this.gameState) {
      localStorage.setItem('aftg_game_state', JSON.stringify(this.gameState));
    }
    localStorage.setItem('aftg_game_stats', JSON.stringify(this.gameStats));
  }

  private loadGameFromStorage(): void {
    try {
      const savedGame = localStorage.getItem('aftg_game_state');
      const savedStats = localStorage.getItem('aftg_game_stats');
      
      if (savedGame) {
        this.gameState = JSON.parse(savedGame);
      }
      
      if (savedStats) {
        this.gameStats = JSON.parse(savedStats);
      }
    } catch (error) {
      console.warn('Failed to load game from storage:', error);
    }
  }
}

export const gameService = new GameService();
