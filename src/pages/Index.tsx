
import React, { useEffect, useState } from 'react';
import GameLobby from '@/components/GameLobby';
import Game from '@/components/Game';

type GameState = 'lobby' | 'playing';
type GameMode = 'single' | 'multiplayer';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('lobby');
  const [gameMode, setGameMode] = useState<GameMode>('single');
  const [gameCode, setGameCode] = useState('');
  const [gameId, setGameId] = useState('');
  const [playerId, setPlayerId] = useState('');

  const handleStartGame = (payload: { gameId: string; playerId: string; gameCode: string; gameMode: GameMode }) => {
    setGameMode(payload.gameMode);
    setGameCode(payload.gameCode);
    setGameId(payload.gameId);
    setPlayerId(payload.playerId);
    setGameState('playing');
    localStorage.setItem('tsa_last_game', JSON.stringify(payload));
  };

  const handleBackToLobby = () => {
    setGameState('lobby');
    setGameCode('');
    setGameId('');
    setPlayerId('');
    localStorage.removeItem('tsa_last_game');
  };

  useEffect(() => {
    const raw = localStorage.getItem('tsa_last_game');
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { gameId: string; playerId: string; gameCode: string; gameMode: GameMode };
      if (saved?.gameId && saved?.playerId && saved?.gameMode) {
        setGameMode(saved.gameMode);
        setGameCode(saved.gameCode || '');
        setGameId(saved.gameId);
        setPlayerId(saved.playerId);
        setGameState('playing');
      }
    } catch {
      localStorage.removeItem('tsa_last_game');
    }
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {gameState === 'lobby' ? (
        <GameLobby onStartGame={handleStartGame} />
      ) : (
        <Game
          gameMode={gameMode}
          gameCode={gameCode}
          gameId={gameId}
          playerId={playerId}
          onBackToLobby={handleBackToLobby}
        />
      )}
    </div>
  );
};

export default Index;
