
import React, { useState, useEffect } from 'react';
import CategoryTracker, { Category } from './CategoryTracker';
import QuestionCard from './QuestionCard';
import { Button } from '@/components/ui/button';
import { Users, RotateCcw } from 'lucide-react';

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
  ]
};

const Game: React.FC<GameProps> = ({ playerName, apiKey, onBackToLobby }) => {
  const [currentPlayer, setCurrentPlayer] = useState<Player>({
    id: '1',
    name: playerName,
    completedCategories: [],
    streak: 0,
    score: 0
  });
  
  const [opponent] = useState<Player>({
    id: '2',
    name: 'Waiting for opponent...',
    completedCategories: [],
    streak: 0,
    score: 0
  });

  const [currentCategory, setCurrentCategory] = useState<Category>('History');
  const [currentQuestion, setCurrentQuestion] = useState(mockQuestions.History[0]);
  const [gamePhase, setGamePhase] = useState<'playing' | 'waiting' | 'won' | 'lost'>('playing');
  const [isMyTurn, setIsMyTurn] = useState(true);

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

      // Continue turn, pick new category
      setTimeout(() => {
        pickNextCategory(newStreak);
      }, 2500);
    } else {
      // Reset streak and end turn
      setCurrentPlayer(prev => ({ ...prev, streak: 0 }));
      setIsMyTurn(false);
      setGamePhase('waiting');
      
      setTimeout(() => {
        setIsMyTurn(true);
        setGamePhase('playing');
        pickNextCategory(0);
      }, 3000);
    }
  };

  const pickNextCategory = (streak: number) => {
    const availableCategories = categories.filter(cat => 
      !currentPlayer.completedCategories.includes(cat)
    );
    
    if (availableCategories.length === 0) return;
    
    // If streak >= 3, player can choose (for now we'll pick randomly)
    // TODO: Add category selection UI for streak >= 3
    const randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    setCurrentCategory(randomCategory);
    
    // Set mock question (TODO: replace with API call)
    if (randomCategory === 'Science') {
      setCurrentQuestion(mockQuestions.Science[0]);
    } else {
      setCurrentQuestion(mockQuestions.History[0]);
    }
  };

  const getShuffledAnswers = () => {
    const answers = [currentQuestion.correct_answer, ...currentQuestion.wrong_answers];
    return answers.sort(() => Math.random() - 0.5);
  };

  if (gamePhase === 'won') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-neon-green neon-text animate-bounce mb-4">
            YOU WON!
          </h1>
          <p className="text-2xl text-neon-cyan">
            Damn, you actually know stuff! 🏆
          </p>
          <p className="text-gray-400 mt-2">
            Final Score: {currentPlayer.score} points
          </p>
        </div>
        
        <div className="space-y-4">
          <Button className="game-button">
            <RotateCcw className="mr-2 h-5 w-5" />
            Rematch
          </Button>
          <Button onClick={onBackToLobby} variant="outline" className="border-gray-600 text-gray-300">
            Back to Lobby
          </Button>
        </div>
      </div>
    );
  }

  if (gamePhase === 'waiting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-neon-yellow neon-text mb-4">
            Opponent's Turn
          </h2>
          <p className="text-gray-400">Waiting for them to mess up... 🍿</p>
          <div className="mt-8 animate-pulse">
            <Users className="h-16 w-16 mx-auto text-neon-cyan" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 flex flex-col">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neon-pink neon-text">AFTG</h1>
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
        />
        <CategoryTracker
          completedCategories={opponent.completedCategories}
          playerName={opponent.name}
          isOpponent={true}
        />
      </div>

      {/* Question Area */}
      {isMyTurn && (
        <div className="flex-1 flex items-center justify-center">
          <QuestionCard
            category={currentCategory}
            question={currentQuestion.question}
            answers={getShuffledAnswers()}
            correctAnswer={currentQuestion.correct_answer}
            onAnswer={handleAnswer}
            streak={currentPlayer.streak}
          />
        </div>
      )}
    </div>
  );
};

export default Game;
