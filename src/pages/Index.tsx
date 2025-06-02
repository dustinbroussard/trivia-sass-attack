
import React, { useState } from 'react';
import GameLobby from '@/components/GameLobby';
import Game from '@/components/Game';

type GameState = 'lobby' | 'playing';
type GameMode = 'single' | 'multiplayer';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('lobby');
  const [playerName, setPlayerName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [gameMode, setGameMode] = useState<GameMode>('single');
  const [gameCode, setGameCode] = useState('');

  const handleStartGame = (name: string, key: string, mode: GameMode, code?: string) => {
    setPlayerName(name);
    setApiKey(key);
    setGameMode(mode);
    setGameCode(code || '');
    setGameState('playing');
  };

  const handleBackToLobby = () => {
    setGameState('lobby');
    setPlayerName('');
    setApiKey('');
    setGameCode('');
  };

  return (
    <div className="min-h-screen bg-black">
      {gameState === 'lobby' ? (
        <GameLobby onStartGame={handleStartGame} />
      ) : (
        <Game 
          playerName={playerName} 
          apiKey={apiKey}
          gameMode={gameMode}
          gameCode={gameCode}
          onBackToLobby={handleBackToLobby}
        />
      )}
    </div>
  );
};

export default Index;
