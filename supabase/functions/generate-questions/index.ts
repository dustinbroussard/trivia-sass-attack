import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';

type GeneratedQuestion = {
  category: string;
  question_text: string;
  correct_answer: string;
  wrong_answers: string[];
  quip_correct: string;
  quip_wrong: string;
};

const CATEGORIES = ['History', 'Science', 'Pop Culture', 'Art & Music', 'Sports', 'Random'];

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

async function getUserId(req: Request, client: ReturnType<typeof createClient>): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

function buildPrompt(category: string) {
  return `
You are a trivia writer. Return ONLY JSON: a top-level array of exactly 3 questions for category "${category}".
Each item must be:
{
  "category": "${category}",
  "question_text": "Short, unambiguous question",
  "correct_answer": "Concise answer",
  "wrong_answers": ["Plausible wrong 1", "Plausible wrong 2", "Plausible wrong 3"],
  "quip_correct": "Smug celebratory one-liner",
  "quip_wrong": "Sarcastic one-liner"
}
Rules:
- No trick questions, no ambiguity, no multi-answer.
- Wrong answers must be unique and not equal to correct_answer.
- Avoid slurs, politics, and explicit content. PG-13 only.
- Output JSON only, no markdown or commentary.
`;
}

async function callOpenRouter(openRouterKey: string, category: string): Promise<GeneratedQuestion[]> {
  const model = Deno.env.get('OPENROUTER_MODEL') || 'google/gemini-2.0-flash-001';
  const url = Deno.env.get('OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1/chat/completions';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openRouterKey}`,
      'HTTP-Referer': 'https://trivia-sass-attack',
      'X-Title': 'Trivia Sass Attack',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a precise JSON generator.' },
        { role: 'user', content: buildPrompt(category) },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenRouter error ${res.status}: ${text || res.statusText}`);
  }

  const data = await res.json();
  let content = data?.choices?.[0]?.message?.content ?? '';
  if (typeof content !== 'string') throw new Error('No content from OpenRouter');
  content = content.trim();
  if (content.startsWith('```')) {
    content = content.replace(/^```[a-zA-Z]*\n/, '').replace(/```\s*$/, '');
  }

  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed)) throw new Error('Expected JSON array');
  return parsed as GeneratedQuestion[];
}

function validateQuestion(item: GeneratedQuestion, category: string) {
  if (!item) throw new Error('Invalid question');
  if (item.category !== category) throw new Error('Category mismatch');
  if (!item.question_text || !item.correct_answer) throw new Error('Missing question fields');
  if (!Array.isArray(item.wrong_answers) || item.wrong_answers.length !== 3) throw new Error('Wrong answers must be length 3');
  const all = [item.correct_answer, ...item.wrong_answers].map((a) => a.trim());
  const set = new Set(all);
  if (set.size !== 4) throw new Error('Answers must be unique');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) {
      return jsonResponse(500, { error: 'Missing Supabase env vars' });
    }

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const userId = await getUserId(req, admin);
    if (!userId) return jsonResponse(401, { error: 'Unauthorized' });

    const body = await req.json().catch(() => ({}));
    const gameId = body?.gameId as string | undefined;
    const openRouterKey = body?.openRouterKey as string | undefined;
    if (!gameId || !openRouterKey) return jsonResponse(400, { error: 'Missing gameId or openRouterKey' });

    const { data: hostPlayer } = await admin
      .from('game_players')
      .select('id, role')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .maybeSingle();
    if (!hostPlayer || hostPlayer.role !== 'host') {
      return jsonResponse(403, { error: 'Only host can generate questions' });
    }

    const allQuestions: GeneratedQuestion[] = [];
    for (const category of CATEGORIES) {
      const raw = await callOpenRouter(openRouterKey, category);
      const slice = raw.slice(0, 3);
      if (slice.length !== 3) {
        throw new Error(`Expected 3 questions for ${category}`);
      }
      slice.forEach((item) => validateQuestion(item, category));
      allQuestions.push(...slice);
    }

    const rows = allQuestions.map((item) => {
      const choices = shuffle([item.correct_answer, ...item.wrong_answers]);
      const correct_index = choices.findIndex((c) => c === item.correct_answer);
      return {
        game_id: gameId,
        category: item.category,
        question_text: item.question_text,
        choices,
        correct_index,
        quip_correct: item.quip_correct,
        quip_wrong: item.quip_wrong,
      };
    });

    const { error: insertError } = await admin.from('game_questions').insert(rows);
    if (insertError) return jsonResponse(500, { error: insertError.message });

    const { data: game } = await admin
      .from('games')
      .select('guest_player_id')
      .eq('id', gameId)
      .single();

    const nextStatus = game?.guest_player_id ? 'active' : 'waiting';
    const { error: updateError } = await admin
      .from('games')
      .update({ status: nextStatus })
      .eq('id', gameId);
    if (updateError) return jsonResponse(500, { error: updateError.message });

    return jsonResponse(200, { ok: true });
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : 'Unknown error' });
  }
});
