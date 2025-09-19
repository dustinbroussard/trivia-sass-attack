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

function readEnv(key: string): string | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env && key in import.meta.env) {
    return import.meta.env[key] as string | undefined;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

function getApiKey(): string {
  const key =
    readEnv('VITE_OPENROUTER_API_KEY') ||
    readEnv('OPENROUTER_API_KEY') ||
    readEnv('OPENROUTER_API_KEY_VITE');
  if (!key) {
    throw new Error('Missing OpenRouter API key. Set VITE_OPENROUTER_API_KEY in your environment');
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

