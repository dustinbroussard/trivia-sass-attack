import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import QuestionCard from '@/components/QuestionCard';
import CategoryTracker from '@/components/CategoryTracker';
import { Categories, type Category, type GamePlayerRow, type GameQuestionPublic, type GameRow } from '@/types/game';
import { fetchGame, startTurn, submitAnswer } from '@/services/gameService';

type GameMode = 'single' | 'multiplayer';

interface GameProps {
  gameMode: GameMode;
  gameCode: string;
  gameId: string;
  playerId: string;
  onBackToLobby: () => void;
}

const Game: React.FC<GameProps> = ({ gameMode, gameCode, gameId, playerId, onBackToLobby }) => {
  const { toast } = useToast();
  const [game, setGame] = useState<GameRow | null>(null);
  const [players, setPlayers] = useState<GamePlayerRow[]>([]);
  const [question, setQuestion] = useState<GameQuestionPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnLoading, setTurnLoading] = useState(false);
  const startInFlight = useRef(false);

  const me = useMemo(() => players.find((p) => p.id === playerId) || null, [players, playerId]);
  const opponent = useMemo(() => players.find((p) => p.id !== playerId) || null, [players, playerId]);
  const isMyTurn = game?.current_turn_player_id === playerId;
  const allowCategoryChoice = Boolean(game?.allow_category_choice);

  const refreshGame = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    try {
      const data = await fetchGame(gameId);
      setGame(data.game);
      setPlayers(data.players);
      setQuestion(data.question);
      if (!data.players.find((p) => p.id === playerId)) {
        setError('Session mismatch. Please return to the lobby and rejoin.');
      } else {
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game.');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    void refreshGame();
  }, [refreshGame]);

  useEffect(() => {
    if (!gameId) return;

    const channel = supabase.channel(`game-db-${gameId}`);
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        () => {
          void refreshGame();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_players', filter: `game_id=eq.${gameId}` },
        () => {
          void refreshGame();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [gameId, refreshGame]);

  useEffect(() => {
    const onFocus = () => void refreshGame();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refreshGame();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refreshGame]);

  const canAutoStart = useMemo(() => {
    if (!game || !me) return false;
    if (game.status !== 'active') return false;
    if (!isMyTurn) return false;
    if (game.active_question_id) return false;
    if (allowCategoryChoice) return false;
    return true;
  }, [allowCategoryChoice, game, isMyTurn, me]);

  useEffect(() => {
    if (!canAutoStart || startInFlight.current) return;
    startInFlight.current = true;
    startTurn({ gameId })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to start turn.'))
      .finally(() => {
        startInFlight.current = false;
      });
  }, [canAutoStart, gameId]);

  const handleStartTurn = async (categoryChoice?: Category) => {
    if (startInFlight.current) return;
    startInFlight.current = true;
    setTurnLoading(true);
    try {
      await startTurn({ gameId, categoryChoice });
      await refreshGame();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start turn.');
    } finally {
      startInFlight.current = false;
      setTurnLoading(false);
    }
  };

  const incompleteCategories = useMemo(() => {
    if (!me) return Categories;
    return Categories.filter((cat) => !me.categories_completed.includes(cat));
  }, [me]);

  const handleAnswer = async (answerIndex: number) => {
    if (!question) {
      return { correct: false, quip: 'No active question.' };
    }
    const result = await submitAnswer({
      gameId,
      questionId: question.id,
      choiceIndex: answerIndex,
    });
    toast({
      description: result.quip,
      variant: result.correct ? 'default' : 'destructive',
    });
    await refreshGame();
    return { correct: result.correct, quip: result.quip, correctIndex: result.correctIndex };
  };

  return (
    <div className="min-h-screen text-white">
      <div className="flex items-center justify-between p-4">
        <Button variant="outline" onClick={onBackToLobby}>Back to Lobby</Button>
        {gameMode === 'multiplayer' && (
          <div className="text-sm text-gray-300">
            Game Code: <span className="font-bold text-green-400 tracking-widest">{gameCode}</span>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {error && (
          <Card className="bg-red-900/30 border-red-500/60">
            <CardContent className="p-4 text-red-200">{error}</CardContent>
          </Card>
        )}

        {loading && !game && (
          <Card className="bg-black/50 border-cyan-500/40">
            <CardContent className="p-4 text-cyan-200">Loading game...</CardContent>
          </Card>
        )}

        {gameMode === 'multiplayer' && game?.status === 'waiting' && (
          <Card className="bg-black/50 border-yellow-500/40">
            <CardContent className="p-4 text-yellow-200">
              Waiting for opponent to join or for the host to start...
            </CardContent>
          </Card>
        )}

        <div className={`grid gap-4 ${gameMode === 'single' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          <CategoryTracker
            completedCategories={me?.categories_completed || []}
            currentCategory={game?.active_category || undefined}
            playerName={me?.name || 'You'}
            streak={me?.streak || 0}
          />
          {gameMode === 'multiplayer' && opponent ? (
            <CategoryTracker
              completedCategories={opponent.categories_completed}
              currentCategory={game?.active_category || undefined}
              playerName={opponent.name}
              isOpponent
              streak={opponent.streak}
            />
          ) : gameMode === 'multiplayer' ? (
            <Card className="bg-black/40 border-gray-600">
              <CardHeader>
                <CardTitle className="text-gray-300">Opponent</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400">Waiting for opponent...</CardContent>
            </Card>
          ) : null}
        </div>

        {game && (
          <div className="flex items-center justify-between text-sm text-gray-300">
            <span>Your score: <strong className="text-cyan-300">{me?.score ?? 0}</strong></span>
            {gameMode === 'multiplayer' && (
              <span>Opponent score: <strong className="text-pink-300">{opponent?.score ?? 0}</strong></span>
            )}
            <span>Turn: <strong className="text-yellow-300">{isMyTurn ? 'You' : opponent?.name || 'Opponent'}</strong></span>
          </div>
        )}

        {game?.status === 'completed' && (
          <Card className="bg-green-900/30 border-green-500/60">
            <CardContent className="p-6 text-center text-green-200 text-xl font-bold">
              {game.winner_player_id === playerId ? 'You won! 🏆' : `${opponent?.name || 'Opponent'} wins!`}
            </CardContent>
          </Card>
        )}

        {game?.status === 'active' && (
          <div className="space-y-4">
            {gameMode === 'multiplayer' && !isMyTurn && (
              <Card className="bg-black/50 border-purple-500/40">
                <CardContent className="p-4 text-purple-200 text-center">
                  {opponent?.name || 'Opponent'} is answering...
                </CardContent>
              </Card>
            )}

            {question && (gameMode === 'single' || isMyTurn) && (
              <QuestionCard
                category={question.category}
                question={question.question_text}
                answers={question.choices}
                onAnswer={handleAnswer}
                streak={me?.streak || 0}
              />
            )}

            {isMyTurn && !question && (
              <Card className="bg-black/50 border-cyan-500/40">
                <CardContent className="p-4 space-y-4">
                  <p className="text-cyan-200 font-bold">
                    {allowCategoryChoice ? 'Pick your category:' : 'Ready for the next question?'}
                  </p>
                  {allowCategoryChoice ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {incompleteCategories.map((cat) => (
                        <Button key={cat} variant="outline" onClick={() => void handleStartTurn(cat)} disabled={turnLoading}>
                          {cat}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <Button onClick={() => void handleStartTurn()} className="bg-cyan-600 hover:bg-cyan-500" disabled={turnLoading}>
                      {turnLoading ? 'Loading...' : 'Draw Question'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;
