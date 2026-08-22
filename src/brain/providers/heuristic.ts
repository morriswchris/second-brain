/**
 * A rule-based enrichment provider.
 *
 * It serves two purposes:
 *   1. A genuine offline fallback — deterministic, instant, no model required.
 *      Enrichment must degrade gracefully, and this is the floor it degrades to.
 *   2. The baseline the eval harness scores an LLM against. If a small on-device
 *      model can't beat these hand-written rules, it isn't worth shipping.
 *
 * It deliberately does *not* resolve dates or recurrence itself — `coerceMetadata`
 * owns that via the deterministic resolver, so every provider gets the same
 * authoritative date handling for free.
 */

import { classifyKind, classifyPriority, classifyTopics } from '@/brain/taxonomy';
import type { EnrichmentInput, EnrichmentProvider, RawMetadata } from '@/brain/types';

/**
 * Pull out capitalized names in two shapes:
 *   - after a relational cue: "call Sarah", "with Mom"
 *   - as the subject of a reporting verb: "Sarah recommended", "Mom said"
 * A real LLM handles names far more robustly; these rules are the baseline.
 */
function extractPeople(text: string): string[] {
  const people = new Set<string>();
  const cued = /\b(?:call|with|from|for|meet|tell|ask|email|text)\s+([A-Z][a-z]+)\b/g;
  const subject = /\b([A-Z][a-z]+)\s+(?:recommended|said|told|suggested|wants|mentioned|asked)\b/g;
  for (const re of [cued, subject]) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      people.add(m[1].toLowerCase());
    }
  }
  return Array.from(people);
}

export function createHeuristicProvider(): EnrichmentProvider {
  return {
    name: 'heuristic',
    async enrich(input: EnrichmentInput): Promise<RawMetadata> {
      return {
        kind: classifyKind(input.text),
        topics: classifyTopics(input.text),
        people: extractPeople(input.text),
        priority: classifyPriority(input.text),
        // dueDate / recurrence intentionally omitted — coerceMetadata resolves
        // them deterministically from the text.
      };
    },
  };
}
