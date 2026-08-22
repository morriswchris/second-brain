/**
 * A Claude-backed enrichment provider — the quality-ceiling reference line.
 *
 * This is the *cloud* path, not the on-device one: it exists to answer "how far
 * is a small local model from a strong model on this extraction task?" It reuses
 * the exact same prompt and JSON contract as the on-device LLM would, so the
 * comparison is apples-to-apples; only the runtime differs.
 *
 * Model: Claude Haiku 4.5 by default — the cheapest, fastest Claude, which is
 * the right reference for a lightweight extraction task (and closest in spirit
 * to a small model). Override with BRAIN_LLM_MODEL.
 *
 * NODE-ONLY. Never import from the React Native app or jest-expo tests. Loaded
 * only by the tsx eval runner. Credentials resolve the usual Anthropic way
 * (ANTHROPIC_API_KEY or an `ant auth login` profile); if none is available the
 * runner detects the auth error and skips this provider.
 */

import { createLlmProvider, type CompleteFn } from '@/brain/providers/llm';
import type { EnrichmentProvider } from '@/brain/types';

const DEFAULT_MODEL = 'claude-haiku-4-5';

export interface AnthropicProviderOptions {
  model?: string;
}

/** Build a `complete()` backed by the Anthropic Messages API. */
export async function createAnthropicComplete(
  options: AnthropicProviderOptions = {},
): Promise<CompleteFn> {
  const model = options.model ?? process.env.BRAIN_LLM_MODEL ?? DEFAULT_MODEL;
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic();

  return async (prompt: string): Promise<string> => {
    const response = await client.messages.create({
      model,
      max_tokens: 512, // extraction output is a small JSON object
      system: 'You are a precise metadata extractor. Output only the requested JSON.',
      messages: [{ role: 'user', content: prompt }],
    });
    const parts: string[] = [];
    for (const block of response.content) {
      if (block.type === 'text') parts.push(block.text);
    }
    return parts.join('');
  };
}

export async function createAnthropicProvider(
  options: AnthropicProviderOptions = {},
): Promise<EnrichmentProvider> {
  const complete = await createAnthropicComplete(options);
  const model = options.model ?? process.env.BRAIN_LLM_MODEL ?? DEFAULT_MODEL;
  return createLlmProvider(complete, `anthropic:${model}`);
}
