
import React, { useState } from 'react';
import GameLobby from '@/components/GameLobby';
import Game from '@/components/Game';

type GameState = 'lobby' | 'playing';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('lobby');
  const [playerName, setPlayerName] = useState('');
  const [apiKey, setApiKey] = useState('');

  const handleStartGame = (name: string, key: string) => {
    setPlayerName(name);
    setApiKey(key);
    setGameState('playing');
  };

  const handleBackToLobby = () => {
    setGameState('lobby');
    setPlayerName('');
    setApiKey('');
  };

  return (
    <div className="min-h-screen bg-black">
      {gameState === 'lobby' ? (
        <GameLobby onStartGame={handleStartGame} />
      ) : (
        <Game 
          playerName={playerName} 
          apiKey={apiKey} 
          onBackToLobby={handleBackToLobby}
        />
      )}
    </div>
  );
};

export default Index;
