import { env } from '../_generated/server';
import { ConvexError } from 'convex/values';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export const freeProvider = { data_collection: 'deny' as const, allow_fallbacks: false, max_price: { prompt: 0, completion: 0, image: 0, audio: 0, request: 0 } };
export function modelId(task: 'text' | 'vision') {
  const id = (task === 'vision' ? env.OPENROUTER_VISION_MODEL : env.OPENROUTER_TEXT_MODEL) || 'dots-studio/dots-3-note-preview:free';
  if (!id.endsWith(':free') || id.startsWith('nvidia/')) throw new ConvexError('AI configuration is unavailable. Choose an approved free model.');
  return id;
}
export function chatModel() {
  return createOpenRouter({ apiKey: env.OPENROUTER_API_KEY }).chat(modelId('text'), { provider: freeProvider, reasoning: { enabled: false, effort: 'none' } });
}
export async function completion(task: 'text' | 'vision', content: unknown, instruction: string) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST', headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://github.com/debsouryadatta/Tenday', 'X-Title': 'Tenday' },
    body: JSON.stringify({ model: modelId(task), provider: freeProvider, messages: [{ role: 'system', content: instruction }, { role: 'user', content }], temperature: 0.2, max_tokens: 5000, reasoning: { enabled: false }, response_format: { type: 'json_object' } }),
    signal: AbortSignal.timeout(55000),
  });
  if (!response.ok) throw new ConvexError(response.status === 429 ? 'Free AI capacity is busy. Your input is kept; try again later or enter it manually.' : 'AI is temporarily unavailable. Your input is kept; retry or enter it manually.');
  const data: unknown = await response.json();
  const parsed = data as { choices?: { message?: { content?: unknown } }[]; usage?: { cost?: number } };
  if (parsed.usage?.cost && parsed.usage.cost > 0) throw new ConvexError('The AI response did not meet the free-only policy.');
  const text = parsed.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || text.length > 100000) throw new ConvexError('AI returned an unreadable response. Review manually or retry.');
  try { return JSON.parse(text.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '')); }
  catch { throw new ConvexError('AI returned an incomplete response. Your input is kept.'); }
}
