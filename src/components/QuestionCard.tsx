
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Zap } from 'lucide-react';
import { Category } from './CategoryTracker';

interface QuestionCardProps {
  category: Category;
  question: string;
  answers: string[];
  correctAnswer: string;
  onAnswer: (answer: string, isCorrect: boolean) => void;
  streak: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  category,
  question,
  answers,
  correctAnswer,
  onAnswer,
  streak
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleAnswerClick = (answer: string) => {
    if (selectedAnswer || showResult) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    const isCorrect = answer === correctAnswer;
    
    setTimeout(() => {
      onAnswer(answer, isCorrect);
    }, 2000);
  };

  const getAnswerButtonClass = (answer: string) => {
    if (!showResult) {
      return 'w-full p-4 text-left bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-all duration-300 hover:scale-105';
    }
    
    if (answer === correctAnswer) {
      return 'w-full p-4 text-left bg-neon-green/30 border-neon-green border-2 rounded-lg neon-border text-neon-green font-bold';
    }
    
    if (answer === selectedAnswer && answer !== correctAnswer) {
      return 'w-full p-4 text-left bg-red-500/30 border-red-500 border-2 rounded-lg text-red-400 font-bold';
    }
    
    return 'w-full p-4 text-left bg-gray-800/50 border border-gray-600 rounded-lg opacity-50';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Category & Streak Display */}
      <div className="flex justify-between items-center mb-4">
        <div className="bg-neon-purple/20 border border-neon-purple/50 rounded-lg px-4 py-2">
          <span className="text-neon-purple font-bold neon-text">{category}</span>
        </div>
        {streak > 0 && (
          <div className="bg-neon-yellow/20 border border-neon-yellow/50 rounded-lg px-4 py-2 flex items-center">
            <Zap className="h-4 w-4 mr-2 text-neon-yellow" />
            <span className="text-neon-yellow font-bold">{streak} Streak!</span>
          </div>
        )}
      </div>

      <Card className="bg-black/50 border-neon-cyan/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-center text-white text-xl leading-relaxed">
            {question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {answers.map((answer, index) => (
            <button
              key={index}
              onClick={() => handleAnswerClick(answer)}
              disabled={showResult}
              className={getAnswerButtonClass(answer)}
            >
              <span className="font-semibold">{String.fromCharCode(65 + index)}.</span> {answer}
            </button>
          ))}
          
          {showResult && (
            <div className="mt-6 p-4 rounded-lg bg-black/30 border border-gray-600 text-center">
              {selectedAnswer === correctAnswer ? (
                <div className="text-neon-green">
                  <div className="text-2xl font-bold mb-2 neon-text animate-pulse">CORRECT!</div>
                  <p className="text-sm">Nice work, smartass! 🎯</p>
                </div>
              ) : (
                <div className="text-red-400">
                  <div className="text-2xl font-bold mb-2">WRONG!</div>
                  <p className="text-sm">Better luck next time, genius! 💀</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionCard;
