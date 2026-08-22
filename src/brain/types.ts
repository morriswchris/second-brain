/**
 * Public types for the `brain` module — the intelligence layer that turns a
 * raw captured note into structured, searchable metadata and answers natural
 * language questions over the collection.
 *
 * The design principle carried over from `notes/types.ts`: capture must never
 * depend on enrichment. Everything here operates on notes that already exist,
 * best-effort, and can be re-run later when the model or prompt improves.
 */

/** Coarse classification of what a note *is*. Drives how search treats it. */
export type NoteKind = 'task' | 'appointment' | 'idea' | 'fact' | 'shopping' | 'note';

export const NOTE_KINDS: readonly NoteKind[] = [
  'task',
  'appointment',
  'idea',
  'fact',
  'shopping',
  'note',
];

export type Priority = 'low' | 'normal' | 'high';

export const PRIORITIES: readonly Priority[] = ['low', 'normal', 'high'];

/** Bump when the metadata shape or extraction logic changes materially, so old
 *  notes can be detected and re-enriched in the background. */
export const SCHEMA_VERSION = 1;

/**
 * Structured metadata extracted from a note's text at (or after) capture time.
 * This is what makes retrieval reliable: queries become deterministic filters
 * over these fields plus a topical rank, instead of asking a model to reason
 * over raw text at query time.
 */
export interface NoteMetadata {
  kind: NoteKind;
  /**
   * The date the note is *about*, as an ISO `YYYY-MM-DD` string, or `null` if
   * the note has no temporal anchor. Relative phrases ("next Monday") are
   * resolved deterministically against the capture time — never left to the
   * model's arithmetic.
   */
  dueDate: string | null;
  /** Recurrence rule as a human phrase (e.g. "every other tuesday"), or null. */
  recurrence: string | null;
  /** Named people the note references. */
  people: string[];
  /** Topical tags for coarse grouping (e.g. "health", "work"). */
  topics: string[];
  priority: Priority;
  /** Version of the extraction that produced this metadata. */
  schemaVersion: number;
}

/** A captured note joined with its extracted metadata and search embedding. */
export interface EnrichedNote {
  id: string;
  text: string;
  /** Epoch milliseconds — when the note was captured. */
  createdAt: number;
  metadata: NoteMetadata;
  /** Topical embedding vector, or null if not yet computed. */
  embedding: number[] | null;
}

export interface EnrichmentInput {
  text: string;
  /** Capture time in epoch ms. Relative dates are anchored to this. */
  now: number;
}

/**
 * Raw, *untrusted* metadata as returned by a provider (an LLM, a heuristic,
 * anything). Every field is optional and unknown-typed on purpose — it is run
 * through `coerceMetadata` before it is allowed anywhere near storage.
 */
export interface RawMetadata {
  kind?: unknown;
  dueDate?: unknown;
  recurrence?: unknown;
  people?: unknown;
  topics?: unknown;
  priority?: unknown;
}

/**
 * A source of metadata for a note. The whole point of this interface is that a
 * rule-based baseline, a small on-device LLM, and a cloud model are all
 * interchangeable behind it — the rest of the module doesn't care which one is
 * wired in, and the eval harness can score them against each other.
 */
export interface EnrichmentProvider {
  readonly name: string;
  enrich(input: EnrichmentInput): Promise<RawMetadata>;
}

/**
 * Turns text into a vector for topical similarity. The real implementation is
 * an on-device embedding model; the module only depends on this interface so
 * that model can be swapped without touching search.
 */
export interface Embedder {
  readonly name: string;
  readonly dimensions: number;
  embed(text: string): Promise<number[]>;
}

export interface SearchResult {
  note: EnrichedNote;
  /** Combined relevance score, higher is better. */
  score: number;
  /** Human-readable explanation of why this note matched (date/topic/etc). */
  reasons: string[];
}
