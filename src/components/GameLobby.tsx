
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad, Users, Zap } from 'lucide-react';

interface GameLobbyProps {
  onStartGame: (playerName: string, apiKey: string) => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({ onStartGame }) => {
  const [playerName, setPlayerName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [gameMode, setGameMode] = useState<'create' | 'join' | null>(null);
  const [gameCode, setGameCode] = useState('');

  const handleStartGame = () => {
    if (playerName.trim() && apiKey.trim()) {
      onStartGame(playerName.trim(), apiKey.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Logo Area */}
      <div className="mb-8 text-center">
        <img 
          src="/lovable-uploads/e8ba30c4-f893-494a-9fa5-92837d5ca9ab.png" 
          alt="AFTG Logo" 
          className="w-64 h-auto mx-auto mb-4 drop-shadow-2xl"
        />
        <p className="text-neon-cyan text-lg font-bold neon-text animate-neon-pulse">
          A F-ING TRIVIA GAME
        </p>
        <p className="text-gray-400 mt-2">Fast. Funny. Fair. No BS.</p>
      </div>

      <Card className="w-full max-w-md bg-black/50 border-neon-purple/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-center text-neon-pink neon-text">
            Ready to Get Schooled?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!gameMode ? (
            <div className="space-y-4">
              <Button
                onClick={() => setGameMode('create')}
                className="w-full game-button bg-gradient-to-r from-neon-cyan to-neon-green"
              >
                <Gamepad className="mr-2 h-5 w-5" />
                Create New Game
              </Button>
              <Button
                onClick={() => setGameMode('join')}
                className="w-full game-button bg-gradient-to-r from-neon-yellow to-neon-pink"
              >
                <Users className="mr-2 h-5 w-5" />
                Join Game
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                placeholder="Your Name (keep it classy)"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-black/50 border-neon-cyan/50 text-white placeholder-gray-400"
              />
              
              {gameMode === 'create' && (
                <Input
                  placeholder="OpenRouter API Key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-black/50 border-neon-yellow/50 text-white placeholder-gray-400"
                />
              )}
              
              {gameMode === 'join' && (
                <Input
                  placeholder="Game Code"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  className="bg-black/50 border-neon-pink/50 text-white placeholder-gray-400"
                />
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={() => setGameMode(null)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Back
                </Button>
                <Button
                  onClick={handleStartGame}
                  disabled={!playerName.trim() || (gameMode === 'create' && !apiKey.trim())}
                  className="flex-1 game-button"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Let's Go!
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-gray-500 text-sm max-w-md">
        <p>No ads. No coins. No bullsh*t.</p>
        <p className="mt-1">Answer one question from each category to win. Get one wrong and your turn ends.</p>
      </div>
    </div>
  );
};

export default GameLobby;
