export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface ChatChoice {
  index: number;
  message: { role: 'assistant'; content: string };
}

export interface ChatResponse {
  id: string;
  choices: ChatChoice[];
  model?: string;
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function getApiKey(): string {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
  if (!key) {
    throw new Error('Missing VITE_OPENROUTER_API_KEY. Set it in .env');
  }
  return key;
}

export async function chat(req: ChatRequest): Promise<ChatResponse> {
  const apiKey = getApiKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
    'X-Title': 'Trivia Sass Attack',
  };

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenRouter error ${res.status}: ${text || res.statusText}`);
  }

  return res.json() as Promise<ChatResponse>;
}

