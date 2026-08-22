/**
 * Public surface of the `brain` module — the intelligence layer for the Second
 * Brain: it enriches captured notes into structured metadata and answers
 * natural-language questions over them.
 *
 * Wiring, at a glance:
 *   capture ──▶ buildEnrichedNote(provider, embedder) ──▶ store
 *   query   ──▶ search(query, notes, embedder, now)   ──▶ ranked results
 *
 * The model is always behind an interface (`EnrichmentProvider` / `Embedder`),
 * so a rule-based baseline, a small on-device LLM, or a cloud model are
 * interchangeable — and the eval harness can score them against each other.
 */

export * from '@/brain/types';
export { enrichNote, buildEnrichedNote, type BuildEnrichedOptions } from '@/brain/enrich';
export { search, type SearchOptions } from '@/brain/search';
export { coerceMetadata, fallbackMetadata } from '@/brain/schema';
export {
  resolveRelativeDate,
  resolveRecurrence,
  parseDateWindow,
  isWithinWindow,
  isoDate,
  type DateWindow,
} from '@/brain/dates';
export { createHashEmbedder, cosineSimilarity, tokenize } from '@/brain/embedder';
export { classifyKind, classifyTopics, classifyPriority } from '@/brain/taxonomy';
export { createHeuristicProvider } from '@/brain/providers/heuristic';
export {
  createLlmProvider,
  buildPrompt,
  extractJson,
  type CompleteFn,
} from '@/brain/providers/llm';
