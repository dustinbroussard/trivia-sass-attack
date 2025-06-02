
import React, { useState, useEffect } from 'react';
import CategoryTracker, { Category } from './CategoryTracker';
import QuestionCard from './QuestionCard';
import { Button } from '@/components/ui/button';
import { Users, RotateCcw, Trophy, Target } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  completedCategories: Category[];
  streak: number;
  score: number;
}

interface GameProps {
  playerName: string;
  apiKey: string;
  gameMode: 'single' | 'multiplayer';
  gameCode?: string;
  onBackToLobby: () => void;
}

// Mock data for now - will be replaced with OpenRouter API
const mockQuestions = {
  'History': [
    {
      question: "Which ancient wonder of the world was located in Alexandria?",
      correct_answer: "The Lighthouse of Alexandria",
      wrong_answers: ["The Hanging Gardens", "The Colossus", "The Mausoleum"],
      quip_correct: "Look who knows their ancient architecture! 🏛️",
      quip_wrong: "Clearly not a history buff. The lighthouse guided ships, not your guessing! 🚢"
    }
  ],
  'Science': [
    {
      question: "What is the chemical symbol for gold?",
      correct_answer: "Au",
      wrong_answers: ["Go", "Gd", "Ag"],
      quip_correct: "Golden brain you've got there! ✨",
      quip_wrong: "Swing and a miss! Au is from the Latin 'aurum'. Back to chemistry class! ⚗️"
    }
  ],
  'Pop Culture': [
    {
      question: "Which social media platform was originally called 'FaceMash'?",
      correct_answer: "Facebook",
      wrong_answers: ["Instagram", "Snapchat", "TikTok"],
      quip_correct: "Someone's been paying attention to tech history! 📱",
      quip_wrong: "Nope! Zuckerberg started with FaceMash in his dorm. Try keeping up! 💻"
    }
  ],
  'Art & Music': [
    {
      question: "Which artist painted 'The Starry Night'?",
      correct_answer: "Vincent van Gogh",
      wrong_answers: ["Pablo Picasso", "Claude Monet", "Salvador Dalí"],
      quip_correct: "You've got some culture in you after all! 🎨",
      quip_wrong: "Swing and a miss! Van Gogh would be rolling in his grave! 🌌"
    }
  ],
  'Sports': [
    {
      question: "How many rings are on the Olympic flag?",
      correct_answer: "5",
      wrong_answers: ["4", "6", "7"],
      quip_correct: "Olympic knowledge! Going for the gold! 🥇",
      quip_wrong: "Not exactly Olympic material, are we? 🤦‍♂️"
    }
  ],
  'Random': [
    {
      question: "What's the most stolen food in the world?",
      correct_answer: "Cheese",
      wrong_answers: ["Bread", "Chocolate", "Bananas"],
      quip_correct: "You know your crime statistics! Suspicious... 🧀",
      quip_wrong: "Wrong! It's cheese. Maybe you should stick to legal food acquisition! 🕵️"
    }
  ]
};

const Game: React.FC<GameProps> = ({ playerName, apiKey, gameMode, gameCode, onBackToLobby }) => {
  const [currentPlayer, setCurrentPlayer] = useState<Player>({
    id: '1',
    name: playerName,
    completedCategories: [],
    streak: 0,
    score: 0
  });
  
  const [opponent] = useState<Player>({
    id: '2',
    name: gameMode === 'multiplayer' ? 'Waiting for opponent...' : 'Solo Mode',
    completedCategories: [],
    streak: 0,
    score: 0
  });

  const [currentCategory, setCurrentCategory] = useState<Category>('History');
  const [currentQuestion, setCurrentQuestion] = useState(mockQuestions.History[0]);
  const [gamePhase, setGamePhase] = useState<'playing' | 'waiting' | 'won' | 'lost' | 'category-select'>('playing');
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [canChooseCategory, setCanChooseCategory] = useState(false);

  const categories: Category[] = ['History', 'Science', 'Pop Culture', 'Art & Music', 'Sports', 'Random'];
  
  const handleAnswer = (answer: string, isCorrect: boolean) => {
    console.log(`Answer: ${answer}, Correct: ${isCorrect}`);
    
    if (isCorrect) {
      const newCompletedCategories = [...currentPlayer.completedCategories, currentCategory];
      const newStreak = currentPlayer.streak + 1;
      
      setCurrentPlayer(prev => ({
        ...prev,
        completedCategories: newCompletedCategories,
        streak: newStreak,
        score: prev.score + 1
      }));

      // Check for win condition
      if (newCompletedCategories.length === 6) {
        setGamePhase('won');
        return;
      }

      // Check if player can choose category (3+ streak)
      if (newStreak >= 3) {
        setCanChooseCategory(true);
        setGamePhase('category-select');
        return;
      }

      // Continue turn, pick new category
      setTimeout(() => {
        pickNextCategory(newStreak);
      }, 2500);
    } else {
      // Reset streak and end turn
      setCurrentPlayer(prev => ({ ...prev, streak: 0 }));
      
      if (gameMode === 'multiplayer') {
        setIsMyTurn(false);
        setGamePhase('waiting');
        
        setTimeout(() => {
          setIsMyTurn(true);
          setGamePhase('playing');
          pickNextCategory(0);
        }, 3000);
      } else {
        // In single player, just continue
        setTimeout(() => {
          pickNextCategory(0);
        }, 2500);
      }
    }
  };

  const pickNextCategory = (streak: number) => {
    const availableCategories = categories.filter(cat => 
      !currentPlayer.completedCategories.includes(cat)
    );
    
    if (availableCategories.length === 0) return;
    
    const randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    setCurrentCategory(randomCategory);
    setCurrentQuestion(mockQuestions[randomCategory][0]);
    setGamePhase('playing');
  };

  const handleCategoryChoice = (category: Category) => {
    setCurrentCategory(category);
    setCurrentQuestion(mockQuestions[category][0]);
    setCanChooseCategory(false);
    setGamePhase('playing');
  };

  const getShuffledAnswers = () => {
    const answers = [currentQuestion.correct_answer, ...currentQuestion.wrong_answers];
    return answers.sort(() => Math.random() - 0.5);
  };

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
          <p className="text-gray-400">
            Final Score: {currentPlayer.score} points | Best Streak: {Math.max(...[currentPlayer.streak])}
          </p>
          {gameMode === 'single' && (
            <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
              <p className="text-yellow-400 mb-2">📊 Solo Stats:</p>
              <p className="text-sm text-gray-300">Categories Completed: {currentPlayer.completedCategories.length}/6</p>
              <p className="text-sm text-gray-300">Accuracy: {Math.round((currentPlayer.score / (currentPlayer.score + 1)) * 100)}%</p>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <Button className="game-button bg-gradient-to-r from-green-500 to-cyan-500 border-green-400">
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

  if (gamePhase === 'category-select') {
    const availableCategories = categories.filter(cat => 
      !currentPlayer.completedCategories.includes(cat)
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
          {gameCode && (
            <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
              <p className="text-gray-400 text-sm">Game Code:</p>
              <p className="text-2xl font-bold text-cyan-400 tracking-widest">{gameCode}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 flex flex-col">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-pink-400">AFTG</h1>
          {gameCode && (
            <div className="bg-gray-800/50 px-3 py-1 rounded border border-gray-600">
              <span className="text-gray-400 text-sm">Code: </span>
              <span className="text-cyan-400 font-bold">{gameCode}</span>
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

      {/* Player Trackers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <CategoryTracker
          completedCategories={currentPlayer.completedCategories}
          currentCategory={isMyTurn ? currentCategory : undefined}
          playerName={currentPlayer.name}
          streak={currentPlayer.streak}
        />
        {gameMode === 'multiplayer' && (
          <CategoryTracker
            completedCategories={opponent.completedCategories}
            playerName={opponent.name}
            isOpponent={true}
          />
        )}
      </div>

      {/* Question Area */}
      {isMyTurn && gamePhase === 'playing' && (
        <div className="flex-1 flex items-center justify-center">
          <QuestionCard
            category={currentCategory}
            question={currentQuestion.question}
            answers={getShuffledAnswers()}
            correctAnswer={currentQuestion.correct_answer}
            onAnswer={handleAnswer}
            streak={currentPlayer.streak}
            quipCorrect={currentQuestion.quip_correct}
            quipWrong={currentQuestion.quip_wrong}
          />
        </div>
      )}
    </div>
  );
};

export default Game;
