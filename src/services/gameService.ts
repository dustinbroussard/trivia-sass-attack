import { supabase } from '@/integrations/supabase/client';
import type { Category, GamePlayerRow, GameQuestionPublic, GameRow, SubmitAnswerResult } from '@/types/game';

export async function ensureSession(): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user?.id) {
    return sessionData.session.user.id;
  }
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    throw error || new Error('Unable to sign in anonymously');
  }
  return data.user.id;
}

export async function createGame(params: { name: string; code: string; mode: 'single' | 'multiplayer' }): Promise<{ gameId: string; playerId: string }> {
  const userId = await ensureSession();

  const { data: gameInsert, error: gameError } = await supabase
    .from('games')
    .insert({ code: params.code, status: params.mode === 'single' ? 'active' : 'waiting' })
    .select('id')
    .single();
  if (gameError || !gameInsert) throw gameError || new Error('Failed to create game');

  const { data: playerInsert, error: playerError } = await supabase
    .from('game_players')
    .insert({
      game_id: gameInsert.id,
      user_id: userId,
      name: params.name,
      role: 'host',
    })
    .select('id')
    .single();
  if (playerError || !playerInsert) throw playerError || new Error('Failed to create host player');

  const { error: updateError } = await supabase
    .from('games')
    .update({
      host_player_id: playerInsert.id,
      current_turn_player_id: playerInsert.id,
    })
    .eq('id', gameInsert.id);
  if (updateError) throw updateError;

  return { gameId: gameInsert.id, playerId: playerInsert.id };
}

export async function joinGame(params: { name: string; code: string }): Promise<{ gameId: string; playerId: string }> {
  const userId = await ensureSession();
  const { data: game, error } = await supabase
    .from('games')
    .select('id,status,guest_player_id')
    .eq('code', params.code)
    .maybeSingle();
  if (error || !game) throw error || new Error('Game not found');
  if (game.guest_player_id) throw new Error('Game is already full');

  const { data: playerInsert, error: playerError } = await supabase
    .from('game_players')
    .insert({
      game_id: game.id,
      user_id: userId,
      name: params.name,
      role: 'guest',
    })
    .select('id')
    .single();
  if (playerError || !playerInsert) throw playerError || new Error('Failed to join game');

  const nextStatus = 'active';
  const { error: updateError } = await supabase
    .from('games')
    .update({
      guest_player_id: playerInsert.id,
      status: nextStatus,
    })
    .eq('id', game.id);
  if (updateError) throw updateError;

  return { gameId: game.id, playerId: playerInsert.id };
}

export async function fetchGame(gameId: string): Promise<{
  game: GameRow;
  players: GamePlayerRow[];
  question: GameQuestionPublic | null;
}> {
  await ensureSession();
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();
  if (gameError || !game) throw gameError || new Error('Game not found');

  const { data: players, error: playersError } = await supabase
    .from('game_players')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: true });
  if (playersError || !players) throw playersError || new Error('Failed to load players');

  let question: GameQuestionPublic | null = null;
  if (game.active_question_id) {
    const { data: q, error: qError } = await supabase
      .from('game_questions_public')
      .select('*')
      .eq('id', game.active_question_id)
      .maybeSingle();
    if (qError) throw qError;
    question = q || null;
  }

  return { game, players, question };
}

export async function generateQuestions(params: { gameId: string; openRouterKey: string }): Promise<void> {
  await ensureSession();
  const { error } = await supabase.functions.invoke('generate-questions', {
    body: params,
  });
  if (error) throw error;
}

export async function startTurn(params: { gameId: string; categoryChoice?: Category }): Promise<GameQuestionPublic | null> {
  await ensureSession();
  const { data, error } = await supabase.functions.invoke('start-turn', {
    body: params,
  });
  if (error) throw error;
  return (data?.question as GameQuestionPublic) || null;
}

export async function submitAnswer(params: {
  gameId: string;
  questionId: string;
  choiceIndex: number;
}): Promise<SubmitAnswerResult> {
  await ensureSession();
  const { data, error } = await supabase.functions.invoke('submit-answer', {
    body: params,
  });
  if (error) throw error;
  return data as SubmitAnswerResult;
}

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}
