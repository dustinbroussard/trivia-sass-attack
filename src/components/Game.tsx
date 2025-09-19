
import React, { useState, useEffect, useCallback } from 'react';
import CategoryTracker from './CategoryTracker';
import QuestionCard from './QuestionCard';
import { Button } from '@/components/ui/button';
import { Users, RotateCcw, Trophy, Target, Clock } from 'lucide-react';
import { gameService } from '@/services/gameService';
import { GameState, TriviaQuestion, GameStats, Category } from '@/types/game';
import { questionBankService } from '@/services/questionBank';
import { toast } from '@/hooks/use-toast';

interface GameProps {
  playerName: string;
  apiKey: string;
  gameMode: 'single' | 'multiplayer';
  gameCode?: string;
  onBackToLobby: () => void;
}

const Game: React.FC<GameProps> = ({ playerName, apiKey, gameMode, gameCode, onBackToLobby }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [gamePhase, setGamePhase] = useState<'loading' | 'playing' | 'waiting' | 'won' | 'lost' | 'category-select'>('loading');
  const [gameStats, setGameStats] = useState<GameStats>(gameService.getGameStats());
  const [isLoading, setIsLoading] = useState(false);
  const [refillingCategory, setRefillingCategory] = useState<Category | null>(null);
  const TOAST_MS = Number(import.meta.env.VITE_TOAST_MS || 2000);
  const RETRY_TOAST_MS = Number(import.meta.env.VITE_RETRY_TOAST_MS || 1500);

  

  // Refresh session time every second while active
  useEffect(() => {
    if (gamePhase === 'playing' || gamePhase === 'waiting') {
      const id = setInterval(() => {
        setGameStats(gameService.getGameStats());
      }, 1000);
      return () => clearInterval(id);
    }
  }, [gamePhase]);

  // Toast notifications for question refill events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { category?: Category; phase?: string; source?: string; error?: string; attempt?: number; total?: number; cooldown?: boolean; model?: string };
      if (!detail) return;
      if (detail.phase === 'start' && detail.category) {
        setRefillingCategory(detail.category);
        if (!detail.cooldown) {
          toast({ title: 'Summoning trivia gods…', description: `Refilling ${detail.category}…`, duration: TOAST_MS });
        }
      } else if (detail.phase === 'end' && detail.category) {
        setRefillingCategory(null);
        const src = detail.source === 'openrouter' ? `OpenRouter (${detail.model || 'model'})` : (detail.source === 'local-cooldown' ? 'local bank (cooldown)' : 'local bank');
        toast({ title: 'Questions ready!', description: `${detail.category} refilled from ${src}.`, duration: TOAST_MS });
      } else if (detail.phase === 'error' && detail.category) {
        setRefillingCategory(null);
        toast({ title: 'Fetch hiccup', description: `Using local fallback for ${detail.category}.`, duration: TOAST_MS });
      } else if (detail.phase === 'retry' && detail.attempt && detail.total) {
        // Only toast the first retry to avoid noise
        if (detail.attempt === 2) {
          toast({ title: 'Retrying fetch…', description: `Attempt ${detail.attempt}/${detail.total}`, duration: RETRY_TOAST_MS });
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('qb:refill', handler as EventListener);
      return () => window.removeEventListener('qb:refill', handler as EventListener);
    }
  }, [TOAST_MS, RETRY_TOAST_MS]);

  const initializeGame = useCallback(async () => {
    let newGameState: GameState;
    // Pass API key to question bank for live fetching
    questionBankService.setAPIKey(apiKey);
    
    if (gameMode === 'single') {
      newGameState = gameService.createSinglePlayerGame(playerName);
    } else {
      if (gameCode) {
        const joined = gameService.joinMultiplayerGame(playerName, gameCode);
        if (joined) {
          newGameState = joined;
        } else {
          newGameState = gameService.createMultiplayerGame(playerName, gameCode);
        }
      } else {
        // Generate new game code
        const newCode = Math.floor(1000 + Math.random() * 9000).toString();
        newGameState = gameService.createMultiplayerGame(playerName, newCode);
      }
    }
    
    setGameState(newGameState);
    
    if (newGameState.status === 'active') {
      setIsLoading(true);
      try {
        const question = await gameService.getNextQuestion();
        if (question) {
          setCurrentQuestion(question);
          setGamePhase('playing');
        }
      } catch (error) {
        console.error('Failed to load question:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setGamePhase('waiting');
    }
  }, [apiKey, gameCode, gameMode, playerName]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const loadNextQuestion = async (category?: Category) => {
    if (!gameState) return;
    // Clear current question to show inline loader
    setCurrentQuestion(null);
    setIsLoading(true);
    
    try {
      const question = await gameService.getNextQuestion(category);
      if (question) {
        setCurrentQuestion(question);
        setGamePhase('playing');
      }
    } catch (error) {
      console.error('Failed to load question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (answerIndex: number) => {
    const result = gameService.answerQuestion(answerIndex);
    const updatedGameState = gameService.getGameState();
    const updatedStats = gameService.getGameStats();
    
    setGameState(updatedGameState);
    setGameStats(updatedStats);
    
    if (updatedGameState?.status === 'completed') {
      setGamePhase('won');
      return;
    }
    
    if (result.correct) {
      // Check if player can choose category
      if (gameService.canChooseCategory()) {
        setGamePhase('category-select');
        return;
      }
      
      // Continue with next question
      setTimeout(() => {
        loadNextQuestion();
      }, 2500);
    } else {
      // Wrong answer - either wait for opponent turn or continue in solo
      if (gameMode === 'multiplayer') {
        setGamePhase('waiting');
        // In real implementation, this would listen to Supabase updates
        setTimeout(() => {
          setGamePhase('playing');
          loadNextQuestion();
        }, 3000);
      } else {
        setTimeout(() => {
          loadNextQuestion();
        }, 2500);
      }
    }
  };

  const handleCategoryChoice = (category: Category) => {
    setGamePhase('playing');
    loadNextQuestion(category);
  };

  const handlePlayAgain = () => {
    gameService.resetGame();
    initializeGame();
  };

  const currentPlayer = gameState ? gameService.getCurrentPlayer() : null;
  const isMyTurn = currentPlayer?.id === gameState?.currentTurn;

  // Loading state (initial only)
  if (gamePhase === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-cyan-400 mb-4 animate-pulse">
            🧠 Summoning trivia gods...
          </h2>
          <div className="animate-spin text-4xl">⚡</div>
        </div>
      </div>
    );
  }

  // Win state
  if (gamePhase === 'won') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-green-400 animate-bounce mb-4">
            YOU WON! 🏆
          </h1>
          <p className="text-2xl text-cyan-400 mb-2">
            Damn, you actually know stuff!
          </p>
          
          {gameMode === 'single' && (
            <div className="mt-6 p-6 bg-gray-800/50 rounded-lg border border-gray-600 max-w-md mx-auto">
              <p className="text-yellow-400 mb-4 text-xl">📊 Session Stats:</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-300">Accuracy</p>
                  <p className="text-2xl font-bold text-green-400">{gameStats.accuracy}%</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-300">Best Streak</p>
                  <p className="text-2xl font-bold text-yellow-400">{gameStats.longestStreak}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-300">Questions</p>
                  <p className="text-xl font-bold text-cyan-400">{gameStats.correctAnswers}/{gameStats.totalQuestions}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-300">Categories</p>
                  <p className="text-xl font-bold text-purple-400">{gameStats.categoriesCompleted}/6</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <Button onClick={handlePlayAgain} className="game-button bg-gradient-to-r from-green-500 to-cyan-500 border-green-400">
            <RotateCcw className="mr-2 h-5 w-5" />
            {gameMode === 'single' ? 'Play Again' : 'Rematch'}
          </Button>
          <Button onClick={onBackToLobby} variant="outline" className="border-gray-600 text-gray-300">
            Back to Lobby
          </Button>
        </div>
      </div>
    );
  }

  // Category selection phase
  if (gamePhase === 'category-select') {
    const categories: Category[] = ['History', 'Science', 'Pop Culture', 'Art & Music', 'Sports', 'Random'];
    const availableCategories = categories.filter(cat => 
      !currentPlayer?.completedCategories.includes(cat)
    );

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-yellow-400 mb-4">
            🔥 HOT STREAK! 🔥
          </h2>
          <p className="text-xl text-white mb-2">Choose your next category:</p>
          <p className="text-gray-400">You've earned the right to pick!</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {availableCategories.map((category) => (
            <Button
              key={category}
              onClick={() => handleCategoryChoice(category)}
              className="game-button bg-gradient-to-br from-purple-500 to-pink-500 border-purple-400 p-6 h-auto flex-col"
            >
              <Target className="h-8 w-8 mb-2" />
              <span className="text-sm font-bold">{category}</span>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Waiting for opponent
  if (gamePhase === 'waiting' && gameMode === 'multiplayer') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-yellow-400 mb-4">
            Opponent's Turn 🎯
          </h2>
          <p className="text-gray-400 mb-8">Waiting for them to mess up... 🍿</p>
          <div className="animate-pulse">
            <Users className="h-16 w-16 mx-auto text-cyan-400" />
          </div>
          {gameState?.id && (
            <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
              <p className="text-gray-400 text-sm">Game Code:</p>
              <p className="text-2xl font-bold text-cyan-400 tracking-widest">{gameState.id}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main game view
  return (
    <div className="min-h-screen p-4 flex flex-col">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-pink-400">AFTG</h1>
          {gameState?.id && gameMode === 'multiplayer' && (
            <div className="bg-gray-800/50 px-3 py-1 rounded border border-gray-600">
              <span className="text-gray-400 text-sm">Code: </span>
              <span className="text-cyan-400 font-bold">{gameState.id}</span>
            </div>
          )}
          {gameMode === 'single' && (
            <div className="bg-green-500/20 px-3 py-1 rounded border border-green-500">
              <span className="text-green-400 font-bold flex items-center">
                <Trophy className="h-4 w-4 mr-1" />
                Solo
              </span>
            </div>
          )}
        </div>
        <Button onClick={onBackToLobby} variant="outline" size="sm" className="border-gray-600 text-gray-300">
          Quit Game
        </Button>
      </div>

      {/* Stats / header add-ons */}
      {gameMode === 'single' && (
        <div className="mb-4 p-3 bg-gray-800/30 rounded-lg border border-gray-600">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Accuracy: <span className="text-green-400 font-bold">{gameStats.accuracy}%</span></span>
            <span className="text-gray-400">Streak: <span className="text-yellow-400 font-bold">{currentPlayer?.streak || 0}</span></span>
            <span className="text-gray-400">Score: <span className="text-cyan-400 font-bold">{currentPlayer?.score || 0}</span></span>
            <span className="text-gray-400 flex items-center"><Clock className="h-4 w-4 mr-1" />
              <span className="font-bold text-purple-300">
                {new Date((gameStats.sessionTime || 0) * 1000).toISOString().substring(14, 19)}
              </span>
            </span>
          </div>
        </div>
      )}
      {gameMode === 'multiplayer' && (
        <div className="mb-4 p-2 bg-gray-800/30 rounded-lg border border-gray-600">
          <div className="flex justify-end items-center text-sm">
            <span className="text-gray-400 flex items-center"><Clock className="h-4 w-4 mr-1" />
              <span className="font-bold text-purple-300">
                {new Date((gameStats.sessionTime || 0) * 1000).toISOString().substring(14, 19)}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Player Trackers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {currentPlayer && (
          <CategoryTracker
            completedCategories={currentPlayer.completedCategories}
            currentCategory={isMyTurn ? gameState?.currentCategory : undefined}
            playerName={currentPlayer.name}
            streak={currentPlayer.streak}
          />
        )}
        {gameMode === 'multiplayer' && gameState?.players[1] && (
          <CategoryTracker
            completedCategories={gameState.players[1].completedCategories}
            playerName={gameState.players[1].name}
            isOpponent={true}
          />
        )}
      </div>

      {/* Question Area */}
      {isMyTurn && gamePhase === 'playing' && (
        <div className="flex-1 flex items-center justify-center">
          {isLoading || !currentQuestion || !gameState?.currentCategory ? (
            <div className="w-full max-w-2xl mx-auto p-8 text-center border-2 border-gray-600 rounded-lg bg-black/50">
              <div className="text-3xl mb-2 animate-pulse">⚡</div>
              <p className="text-cyan-300 font-bold">
                {refillingCategory ? `Refilling ${refillingCategory}…` : 'Fetching new questions...'}
              </p>
            </div>
          ) : (
            <QuestionCard
              category={gameState.currentCategory}
              question={currentQuestion.question}
              answers={currentQuestion.choices}
              correctAnswer={currentQuestion.choices[currentQuestion.answer_index]}
              onAnswer={(answerText: string, isCorrect: boolean) => {
                const answerIndex = currentQuestion.choices.indexOf(answerText);
                handleAnswer(answerIndex);
              }}
              streak={currentPlayer?.streak || 0}
              quipCorrect={currentQuestion.correct_quip}
              wrongQuips={currentQuestion.wrong_answer_quips}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Game;
