
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad, Users, Zap, Trophy, Copy } from 'lucide-react';
import { createGame, generateQuestions, joinGame } from '@/services/gameService';

interface GameLobbyProps {
  onStartGame: (payload: {
    gameId: string;
    playerId: string;
    gameCode: string;
    gameMode: 'single' | 'multiplayer';
  }) => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({ onStartGame }) => {
  const [playerName, setPlayerName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [gameMode, setGameMode] = useState<'menu' | 'single' | 'create' | 'join'>('menu');
  const [gameCode, setGameCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateGameCode = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCode(code);
    return code;
  };

  const handleStartGame = async () => {
    if (!playerName.trim()) return;
    setError(null);
    setLoading(true);

    try {
      if (gameMode === 'single') {
        if (!apiKey.trim()) return;
        const code = generateGameCode();
        const { gameId, playerId } = await createGame({ name: playerName.trim(), code, mode: 'single' });
        await generateQuestions({ gameId, openRouterKey: apiKey.trim() });
        onStartGame({ gameId, playerId, gameCode: code, gameMode: 'single' });
        return;
      }

      if (gameMode === 'create') {
        if (!apiKey.trim()) return;
        const code = generateGameCode();
        const { gameId, playerId } = await createGame({ name: playerName.trim(), code, mode: 'multiplayer' });
        await generateQuestions({ gameId, openRouterKey: apiKey.trim() });
        onStartGame({ gameId, playerId, gameCode: code, gameMode: 'multiplayer' });
        return;
      }

      if (gameMode === 'join') {
        if (!gameCode.trim()) return;
        const { gameId, playerId } = await joinGame({ name: playerName.trim(), code: gameCode.trim() });
        onStartGame({ gameId, playerId, gameCode: gameCode.trim(), gameMode: 'multiplayer' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyGameCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
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
        <p className="text-neon-cyan text-lg font-bold animate-pulse">
          A F-ING TRIVIA GAME
        </p>
        <p className="text-gray-400 mt-2">Fast. Funny. Fair. No BS. 🎯</p>
      </div>

      <Card className="w-full max-w-md bg-black/50 border-purple-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-center text-neon-pink">
            {gameMode === 'menu' && "Ready to Get Schooled? 🤓"}
            {gameMode === 'single' && "Solo Challenge 🏆"}
            {gameMode === 'create' && "Host a Game 🎮"}
            {gameMode === 'join' && "Join the Fun 🚀"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {gameMode === 'menu' ? (
            <div className="space-y-4">
              <Button
                onClick={() => setGameMode('single')}
                className="w-full game-button bg-gradient-to-r from-neon-green to-neon-cyan border-cyan-400"
              >
                <Trophy className="mr-2 h-5 w-5" />
                Solo Mode
              </Button>
              <Button
                onClick={() => setGameMode('create')}
                className="w-full game-button bg-gradient-to-r from-neon-pink to-neon-purple border-pink-400"
              >
                <Gamepad className="mr-2 h-5 w-5" />
                Start New Game
              </Button>
              <Button
                onClick={() => setGameMode('join')}
                className="w-full game-button bg-gradient-to-r from-neon-yellow to-neon-pink border-yellow-400"
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
                className="bg-black/50 border-cyan-500/50 text-white placeholder-gray-400"
              />
              
              {(gameMode === 'create' || gameMode === 'single') && (
                <Input
                  placeholder="OpenRouter API Key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-black/50 border-yellow-500/50 text-white placeholder-gray-400"
                />
              )}
              
              {gameMode === 'join' && (
                <Input
                  placeholder="Enter 4-digit Game Code"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="bg-black/50 border-pink-500/50 text-white placeholder-gray-400 text-center text-2xl tracking-widest"
                />
              )}

              {generatedCode && gameMode === 'create' && (
                <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg text-center">
                  <p className="text-green-400 text-sm mb-2">Your Game Code:</p>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-3xl font-bold text-green-300 tracking-widest">{generatedCode}</span>
                    <Button onClick={copyGameCode} size="sm" variant="outline" className="border-green-500 text-green-400">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-green-400 text-xs mt-2">Share this with your opponent!</p>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-md bg-red-900/40 border border-red-500/60 text-red-200 text-sm">
                  {error}
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    setGameMode('menu');
                    setGeneratedCode('');
                  }}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Back
                </Button>
                <Button
                  onClick={handleStartGame}
                  disabled={
                    loading ||
                    !playerName.trim() || 
                    ((gameMode === 'create' || gameMode === 'single') && !apiKey.trim()) ||
                    (gameMode === 'join' && gameCode.length !== 4)
                  }
                  className="flex-1 game-button bg-gradient-to-r from-purple-500 to-pink-500 border-purple-400"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  {loading ? 'Starting...' : (gameMode === 'single' ? 'Start!' : generatedCode ? 'Ready!' : 'Let\'s Go!')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-gray-500 text-sm max-w-md">
        <p>No ads. No coins. No bullsh*t. 🚫</p>
        <p className="mt-1">Answer one question from each category to win. Get one wrong and your turn ends. 💀</p>
      </div>
    </div>
  );
};

export default GameLobby;
