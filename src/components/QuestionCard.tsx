
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import type { Category } from '@/types/game';

interface QuestionCardProps {
  category: Category;
  question: string;
  answers: string[];
  onAnswer: (answerIndex: number) => Promise<{ correct: boolean; quip: string; correctIndex?: number }>;
  streak: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  category,
  question,
  answers,
  onAnswer,
  streak,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showQuip, setShowQuip] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; quip: string; correctIndex?: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setShowQuip(false);
    setResult(null);
    setSubmitting(false);
  }, [question, answers.join('|')]);

  const handleAnswerClick = async (answer: string, index: number) => {
    if (selectedAnswer || showResult || submitting) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    setSubmitting(true);

    try {
      const payload = await onAnswer(index);
      setResult(payload);
      setTimeout(() => setShowQuip(true), 500);
    } catch (err) {
      setResult({
        correct: false,
        quip: err instanceof Error ? err.message : 'Something went wrong.',
      });
      setShowQuip(true);
    } finally {
      setSubmitting(false);
    }
  };

  const getAnswerButtonClass = (answer: string) => {
    if (!showResult) {
      return 'w-full p-4 text-left bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 rounded-lg transition-all duration-300 hover:scale-105 font-semibold';
    }
    const correctIndex = result?.correctIndex;
    const selectedIndex = selectedAnswer ? answers.indexOf(selectedAnswer) : -1;

    if (typeof correctIndex === 'number' && answers[correctIndex] === answer) {
      return 'w-full p-4 text-left bg-green-600 border-2 border-green-400 rounded-lg text-white font-bold transform scale-105';
    }
    
    if (answer === selectedAnswer && result && result.correct && typeof correctIndex !== 'number') {
      return 'w-full p-4 text-left bg-green-600 border-2 border-green-400 rounded-lg text-white font-bold transform scale-105';
    }

    if (answer === selectedAnswer && result && !result.correct) {
      return 'w-full p-4 text-left bg-red-600 border-2 border-red-400 rounded-lg text-white font-bold';
    }
    
    return 'w-full p-4 text-left bg-gray-800/50 border-2 border-gray-600 rounded-lg opacity-50 font-semibold';
  };

  const categoryColors = {
    'History': 'bg-cyan-500/20 border-cyan-400 text-cyan-400',
    'Science': 'bg-green-500/20 border-green-400 text-green-400',
    'Pop Culture': 'bg-pink-500/20 border-pink-400 text-pink-400',
    'Art & Music': 'bg-purple-500/20 border-purple-400 text-purple-400',
    'Sports': 'bg-yellow-500/20 border-yellow-400 text-yellow-400',
    'Random': 'bg-orange-500/20 border-orange-400 text-orange-400'
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Category & Streak Display */}
      <div className="flex justify-between items-center mb-4">
        <div className={`border-2 rounded-lg px-4 py-2 ${categoryColors[category]}`}>
          <span className="font-bold">{category}</span>
        </div>
        {streak > 0 && (
          <div className="bg-yellow-500/20 border-2 border-yellow-400 rounded-lg px-4 py-2 flex items-center">
            <Zap className="h-4 w-4 mr-2 text-yellow-400" />
            <span className="text-yellow-400 font-bold">{streak} Streak! 🔥</span>
          </div>
        )}
      </div>

      <Card className="bg-black/50 border-2 border-gray-600 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-center text-white text-xl leading-relaxed">
            {question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {answers.map((answer, index) => (
            <button
              key={index}
              onClick={() => handleAnswerClick(answer, index)}
              disabled={showResult || submitting}
              className={getAnswerButtonClass(answer)}
            >
              <span className="font-bold text-lg mr-3">{String.fromCharCode(65 + index)}.</span> 
              {answer}
            </button>
          ))}
          
          {showResult && result && (
            <div className="mt-6 p-6 rounded-lg bg-black/50 border-2 border-gray-600 text-center">
              {result.correct ? (
                <div className="text-green-400">
                  <div className="text-3xl font-bold mb-3 animate-bounce">CORRECT! 🎉</div>
                  {showQuip && <p className="text-lg">{result.quip}</p>}
                </div>
              ) : (
                <div className="text-red-400">
                  <div className="text-3xl font-bold mb-3">WRONG! 💥</div>
                  {showQuip && <p className="text-lg">{result.quip}</p>}
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
