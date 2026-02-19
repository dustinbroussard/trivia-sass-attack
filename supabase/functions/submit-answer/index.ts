import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';

const CATEGORIES = ['History', 'Science', 'Pop Culture', 'Art & Music', 'Sports', 'Random'];

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getUserId(req: Request, client: ReturnType<typeof createClient>): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) return jsonResponse(500, { error: 'Missing Supabase env vars' });

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const userId = await getUserId(req, admin);
    if (!userId) return jsonResponse(401, { error: 'Unauthorized' });

    const body = await req.json().catch(() => ({}));
    const gameId = body?.gameId as string | undefined;
    const questionId = body?.questionId as string | undefined;
    const choiceIndex = Number(body?.choiceIndex);
    if (!gameId || !questionId || Number.isNaN(choiceIndex)) {
      return jsonResponse(400, { error: 'Missing gameId, questionId, or choiceIndex' });
    }
    if (choiceIndex < 0 || choiceIndex > 3) {
      return jsonResponse(400, { error: 'choiceIndex must be 0-3' });
    }

    const { data: game, error: gameError } = await admin
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();
    if (gameError || !game) return jsonResponse(404, { error: 'Game not found' });

    const { data: player, error: playerError } = await admin
      .from('game_players')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .single();
    if (playerError || !player) return jsonResponse(403, { error: 'Player not in game' });

    if (game.current_turn_player_id !== player.id) {
      return jsonResponse(403, { error: 'Not your turn' });
    }
    if (game.status === 'completed') {
      return jsonResponse(400, { error: 'Game already completed' });
    }
    if (game.active_question_id !== questionId) {
      return jsonResponse(400, { error: 'Question mismatch' });
    }

    const { data: question, error: questionError } = await admin
      .from('game_questions')
      .select('*')
      .eq('id', questionId)
      .single();
    if (questionError || !question) return jsonResponse(404, { error: 'Question not found' });
    if (question.game_id !== gameId) return jsonResponse(400, { error: 'Question mismatch' });

    const correct = choiceIndex === question.correct_index;
    const quip = correct ? question.quip_correct : question.quip_wrong;

    await admin
      .from('game_questions')
      .update({ used_at_turn: game.turn_number, used_by_player_id: player.id })
      .eq('id', questionId);

    let nextTurnPlayerId: string | null = player.id;
    let allowCategoryChoice = false;
    let winnerPlayerId: string | null = null;
    let gameStatus: 'waiting' | 'active' | 'completed' = game.status;
    let updatedCategories = Array.isArray(player.categories_completed) ? [...player.categories_completed] : [];
    let updatedScore = player.score;
    let updatedStreak = player.streak;

    if (correct) {
      updatedScore += 1;
      updatedStreak += 1;
      if (question.category && !updatedCategories.includes(question.category)) {
        updatedCategories = [...updatedCategories, question.category];
      }
      allowCategoryChoice = updatedStreak >= 3;
      if (updatedCategories.length >= CATEGORIES.length) {
        gameStatus = 'completed';
        winnerPlayerId = player.id;
      }
    } else {
      updatedStreak = 0;
      const { data: nextPlayer } = await admin
        .from('game_players')
        .select('id, streak')
        .eq('game_id', gameId)
        .neq('id', player.id)
        .limit(1);
      nextTurnPlayerId = nextPlayer?.[0]?.id ?? player.id;
      allowCategoryChoice = (nextPlayer?.[0]?.streak ?? 0) >= 3;
    }

    await admin
      .from('game_players')
      .update({
        score: updatedScore,
        streak: updatedStreak,
        categories_completed: updatedCategories,
      })
      .eq('id', player.id);

    await admin
      .from('games')
      .update({
        current_turn_player_id: nextTurnPlayerId,
        active_question_id: null,
        active_category: null,
        allow_category_choice: allowCategoryChoice,
        status: gameStatus,
        winner_player_id: winnerPlayerId,
      })
      .eq('id', gameId);

    return jsonResponse(200, {
      correct,
      quip,
      correctIndex: question.correct_index,
      nextTurnPlayerId,
      gameStatus,
      winnerPlayerId,
      playerScore: updatedScore,
      playerStreak: updatedStreak,
      categoriesCompleted: updatedCategories,
      allowCategoryChoice,
    });
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : 'Unknown error' });
  }
});
