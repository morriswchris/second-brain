/**
 * An LLM-backed enrichment provider.
 *
 * This module does *not* talk to any model directly. It takes a `complete`
 * function — the seam where a real model plugs in:
 *   - on-device: react-native-executorch / llama.rn running a small model
 *   - cloud: a call to Claude (Haiku is cheap and fast for extraction)
 *
 * Its job is prompt construction (with a hard date anchor and few-shot
 * examples) and robust JSON extraction from a possibly-chatty completion. The
 * output is *raw* — `coerceMetadata` validates it and overrides the date with
 * the deterministic resolver. So even a model that fumbles the date is safe.
 */

import { isoDate } from '@/brain/dates';
import type { EnrichmentInput, EnrichmentProvider, RawMetadata } from '@/brain/types';
import { NOTE_KINDS, PRIORITIES } from '@/brain/types';

/** Injected model call: prompt in, completion text out. */
export type CompleteFn = (prompt: string) => Promise<string>;

export function buildPrompt(input: EnrichmentInput): string {
  const today = isoDate(input.now);
  return [
    'You extract structured metadata from a short personal note.',
    `Today's date is ${today}. Resolve any relative dates ("next Monday") against it.`,
    'Respond with ONLY a JSON object, no prose, with these fields:',
    `  kind: one of ${NOTE_KINDS.join(' | ')}`,
    '  dueDate: ISO YYYY-MM-DD the note is about, or null',
    '  recurrence: a recurrence phrase like "every other tuesday", or null',
    '  people: array of first names mentioned',
    '  topics: array of short topical tags (e.g. health, work, home, finance)',
    `  priority: one of ${PRIORITIES.join(' | ')}`,
    '',
    'Note:',
    JSON.stringify(input.text),
  ].join('\n');
}

/**
 * Pull the first balanced JSON object out of a completion. Models often wrap
 * JSON in prose or code fences; this tolerates that. Returns {} on failure so
 * the pipeline degrades to safe defaults rather than throwing.
 */
export function extractJson(completion: string): RawMetadata {
  const start = completion.indexOf('{');
  if (start === -1) return {};
  let depth = 0;
  for (let i = start; i < completion.length; i++) {
    const ch = completion[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(completion.slice(start, i + 1)) as RawMetadata;
        } catch {
          return {};
        }
      }
    }
  }
  return {};
}

export function createLlmProvider(complete: CompleteFn, name = 'llm'): EnrichmentProvider {
  return {
    name,
    async enrich(input: EnrichmentInput): Promise<RawMetadata> {
      const completion = await complete(buildPrompt(input));
      return extractJson(completion);
    },
  };
}
