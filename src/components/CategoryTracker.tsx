
import React from 'react';
import { Book, Users, Gamepad, Trophy, Heart, Star } from 'lucide-react';

export type Category = 'History' | 'Science' | 'Pop Culture' | 'Art & Music' | 'Sports' | 'Random';

interface CategoryTrackerProps {
  completedCategories: Category[];
  currentCategory?: Category;
  playerName: string;
  isOpponent?: boolean;
}

const categoryConfig = {
  'History': { icon: Book, color: 'text-neon-cyan', bgColor: 'bg-neon-cyan/20' },
  'Science': { icon: Star, color: 'text-neon-green', bgColor: 'bg-neon-green/20' },
  'Pop Culture': { icon: Heart, color: 'text-neon-pink', bgColor: 'bg-neon-pink/20' },
  'Art & Music': { icon: Trophy, color: 'text-neon-purple', bgColor: 'bg-neon-purple/20' },
  'Sports': { icon: Gamepad, color: 'text-neon-yellow', bgColor: 'bg-neon-yellow/20' },
  'Random': { icon: Users, color: 'text-white', bgColor: 'bg-gray-700/50' }
};

const CategoryTracker: React.FC<CategoryTrackerProps> = ({ 
  completedCategories, 
  currentCategory, 
  playerName,
  isOpponent = false 
}) => {
  const categories: Category[] = ['History', 'Science', 'Pop Culture', 'Art & Music', 'Sports', 'Random'];

  return (
    <div className={`p-4 rounded-lg border ${isOpponent ? 'border-gray-600' : 'border-neon-cyan/30'} bg-black/30`}>
      <h3 className={`text-lg font-bold mb-3 ${isOpponent ? 'text-gray-300' : 'text-neon-cyan neon-text'}`}>
        {playerName}
      </h3>
      <div className="grid grid-cols-3 gap-2">
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
                  ? `${config.bgColor} border-current ${config.color} neon-border` 
                  : 'border-gray-600 bg-gray-800/50'
                }
                ${isCurrent && !isOpponent ? 'ring-2 ring-neon-yellow animate-pulse' : ''}
              `}
            >
              <Icon className={`h-6 w-6 mx-auto mb-1 ${isCompleted ? config.color : 'text-gray-500'}`} />
              <p className={`text-xs text-center font-bold ${isCompleted ? config.color : 'text-gray-500'}`}>
                {category.replace(' & ', '\n& ')}
              </p>
              {isCompleted && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-neon-green rounded-full border-2 border-black">
                  <div className="w-full h-full bg-neon-green rounded-full animate-ping"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-center">
        <span className={`text-sm font-bold ${isOpponent ? 'text-gray-400' : 'text-neon-pink'}`}>
          {completedCategories.length}/6 Complete
        </span>
      </div>
    </div>
  );
};

export default CategoryTracker;
