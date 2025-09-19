
import React from 'react';
import { Book, Users, Gamepad, Trophy, Heart, Star } from 'lucide-react';
import type { Category } from '@/types/game';

interface CategoryTrackerProps {
  completedCategories: Category[];
  currentCategory?: Category;
  playerName: string;
  isOpponent?: boolean;
  streak?: number;
}

const categoryConfig = {
  'History': { icon: Book, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', borderColor: 'border-cyan-400' },
  'Science': { icon: Star, color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-400' },
  'Pop Culture': { icon: Heart, color: 'text-pink-400', bgColor: 'bg-pink-500/20', borderColor: 'border-pink-400' },
  'Art & Music': { icon: Trophy, color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-400' },
  'Sports': { icon: Gamepad, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-400' },
  'Random': { icon: Users, color: 'text-orange-400', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-400' }
};

const CategoryTracker: React.FC<CategoryTrackerProps> = ({ 
  completedCategories, 
  currentCategory, 
  playerName,
  isOpponent = false,
  streak = 0
}) => {
  const categories: Category[] = ['History', 'Science', 'Pop Culture', 'Art & Music', 'Sports', 'Random'];

  return (
    <div className={`p-4 rounded-lg border-2 ${isOpponent ? 'border-gray-600' : 'border-cyan-500/50'} bg-black/30`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-lg font-bold ${isOpponent ? 'text-gray-300' : 'text-cyan-400'}`}>
          {playerName}
        </h3>
        {streak > 0 && !isOpponent && (
          <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-full px-3 py-1">
            <span className="text-yellow-400 text-sm font-bold">🔥 {streak}</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-3">
        {categories.map((category) => {
          const config = categoryConfig[category];
          const Icon = config.icon;
          const isCompleted = completedCategories.includes(category);
          const isCurrent = currentCategory === category;
          
          return (
            <div
              key={category}
              className={`
                relative p-3 rounded-lg border-2 transition-all duration-300
                ${isCompleted 
                  ? `category-complete ${config.borderColor}` 
                  : isCurrent && !isOpponent 
                    ? 'category-current'
                    : 'category-incomplete'
                }
              `}
            >
              <Icon className={`h-6 w-6 mx-auto mb-1 ${
                isCompleted ? 'text-white' : 
                isCurrent && !isOpponent ? 'text-black' : 
                'text-gray-500'
              }`} />
              <p className={`text-xs text-center font-bold ${
                isCompleted ? 'text-white' : 
                isCurrent && !isOpponent ? 'text-black' : 
                'text-gray-500'
              }`}>
                {category.replace(' & ', '\n& ')}
              </p>
              {isCompleted && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="text-center">
        <span className={`text-sm font-bold ${isOpponent ? 'text-gray-400' : 'text-pink-400'}`}>
          {completedCategories.length}/6 Complete
        </span>
        {streak >= 3 && !isOpponent && (
          <p className="text-yellow-400 text-xs mt-1 animate-pulse">
            🎯 Choose your category!
          </p>
        )}
      </div>
    </div>
  );
};

export default CategoryTracker;
