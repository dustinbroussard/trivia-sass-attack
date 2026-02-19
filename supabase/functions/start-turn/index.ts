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
    const categoryChoice = body?.categoryChoice as string | undefined;
    if (!gameId) return jsonResponse(400, { error: 'Missing gameId' });

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
    if (game.status !== 'active') {
      return jsonResponse(400, { error: 'Game is not active' });
    }
    if (game.active_question_id) {
      return jsonResponse(200, { question: null });
    }

    const completed = Array.isArray(player.categories_completed) ? player.categories_completed : [];
    const remaining = CATEGORIES.filter((cat) => !completed.includes(cat));
    if (!remaining.length) {
      return jsonResponse(400, { error: 'No remaining categories' });
    }

    let chosen: string;
    if (game.allow_category_choice && categoryChoice && remaining.includes(categoryChoice)) {
      chosen = categoryChoice;
    } else {
      chosen = remaining[Math.floor(Math.random() * remaining.length)];
    }

    let { data: questions } = await admin
      .from('game_questions')
      .select('id, category, question_text, choices, quip_correct, quip_wrong')
      .eq('game_id', gameId)
      .eq('category', chosen)
      .is('used_at_turn', null);

    if (!questions || questions.length === 0) {
      await admin
        .from('game_questions')
        .update({ used_at_turn: null, used_by_player_id: null })
        .eq('game_id', gameId)
        .eq('category', chosen);

      const res = await admin
        .from('game_questions')
        .select('id, category, question_text, choices, quip_correct, quip_wrong')
        .eq('game_id', gameId)
        .eq('category', chosen)
        .is('used_at_turn', null);
      questions = res.data || [];
    }

    if (!questions || questions.length === 0) {
      return jsonResponse(400, { error: 'No questions available' });
    }

    const question = questions[Math.floor(Math.random() * questions.length)];

    const { error: updateError } = await admin
      .from('games')
      .update({
        active_question_id: question.id,
        active_category: question.category,
        turn_number: (game.turn_number ?? 0) + 1,
      })
      .eq('id', gameId);
    if (updateError) return jsonResponse(500, { error: updateError.message });

    return jsonResponse(200, { question });
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : 'Unknown error' });
  }
});
