/**
 * The enrichment orchestrator: raw note text in, safe `NoteMetadata` (and
 * optionally an embedding) out.
 *
 * Contract — this is the load-bearing rule of the whole module:
 *   enrichment is best-effort and NEVER throws and NEVER blocks capture.
 * A provider can be slow, unavailable, or return garbage; the note still gets
 * usable metadata (at minimum a deterministically-resolved date) so it remains
 * findable. Callers run this in the background after the note is already stored.
 */

import { fallbackMetadata, coerceMetadata } from '@/brain/schema';
import type {
  Embedder,
  EnrichedNote,
  EnrichmentInput,
  EnrichmentProvider,
  NoteMetadata,
} from '@/brain/types';

/** Produce validated metadata for a note. Never throws. */
export async function enrichNote(
  input: EnrichmentInput,
  provider: EnrichmentProvider,
): Promise<NoteMetadata> {
  try {
    const raw = await provider.enrich(input);
    return coerceMetadata(raw, input);
  } catch (error) {
    console.warn('[brain] enrichment failed; using deterministic fallback', error);
    return fallbackMetadata(input);
  }
}

export interface BuildEnrichedOptions {
  id: string;
  text: string;
  createdAt: number;
  provider: EnrichmentProvider;
  /** Optional — omit to defer embedding (e.g. compute in a later batch). */
  embedder?: Embedder;
}

/**
 * Convenience: enrich a note and (optionally) embed it in one call, producing
 * the full `EnrichedNote` search operates over. Embedding failure is swallowed
 * — a note without a vector still matches on date/topic filters.
 */
export async function buildEnrichedNote(options: BuildEnrichedOptions): Promise<EnrichedNote> {
  const input: EnrichmentInput = { text: options.text, now: options.createdAt };
  const metadata = await enrichNote(input, options.provider);

  let embedding: number[] | null = null;
  if (options.embedder) {
    try {
      embedding = await options.embedder.embed(options.text);
    } catch (error) {
      console.warn('[brain] embedding failed; note stored without vector', error);
    }
  }

  return {
    id: options.id,
    text: options.text,
    createdAt: options.createdAt,
    metadata,
    embedding,
  };
}
