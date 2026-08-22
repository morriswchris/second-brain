/**
 * Hybrid search — the read side of the module.
 *
 * A query is answered in two moves, mirroring how the metadata was built:
 *   1. Temporal filter: if the query asks about time ("today", "this week",
 *      "overdue"), restrict to notes whose resolved `dueDate` falls in that
 *      window. This is a deterministic SQL-style filter, not a model guess —
 *      it's what makes "what do I have today?" return the "next Monday" note.
 *   2. Topical rank: order the survivors by embedding similarity, boosted by
 *      shared topic/people tags between the query and the note.
 *
 * Purely topical queries skip step 1 and just rank everything by step 2.
 */

import { cosineSimilarity, tokenize } from '@/brain/embedder';
import { isWithinWindow, parseDateWindow } from '@/brain/dates';
import { classifyTopics } from '@/brain/taxonomy';
import type { Embedder, EnrichedNote, SearchResult } from '@/brain/types';

export interface SearchOptions {
  /** Max results to return. */
  limit?: number;
  /** Minimum combined score for a note to appear in a non-temporal query. */
  minScore?: number;
}

const TOPICAL_FLOOR = 0.05;
const TAG_BOOST = 0.5;

export async function search(
  query: string,
  notes: EnrichedNote[],
  embedder: Embedder,
  now: number,
  options: SearchOptions = {},
): Promise<SearchResult[]> {
  const window = parseDateWindow(query, now);
  const queryVec = await embedder.embed(query);
  const queryTokens = new Set(tokenize(query));
  const queryTopics = new Set(classifyTopics(query));
  const minScore = options.minScore ?? TOPICAL_FLOOR;

  const pool = window ? notes.filter((n) => isWithinWindow(n.metadata.dueDate, window)) : notes;

  const results: SearchResult[] = [];

  for (const note of pool) {
    const reasons: string[] = [];
    let score = 0;

    if (window) {
      // A date-window hit is a strong, explicit signal.
      score += 1;
      reasons.push(`due ${note.metadata.dueDate} (${window.label})`);
    }

    const topical = note.embedding ? cosineSimilarity(queryVec, note.embedding) : 0;
    if (topical > TOPICAL_FLOOR) {
      score += topical;
      reasons.push(`topical ${topical.toFixed(2)}`);
    }

    // Shared topic/people tags bridge the lexical gap (store ↔ groceries).
    const tagHits = [
      ...note.metadata.topics.filter((t) => queryTopics.has(t) || queryTokens.has(t)),
      ...note.metadata.people.filter((p) => queryTokens.has(p)),
    ];
    if (tagHits.length > 0) {
      score += TAG_BOOST * tagHits.length;
      reasons.push(`tag: ${Array.from(new Set(tagHits)).join(', ')}`);
    }

    const qualifies = window ? true : score >= minScore;
    if (qualifies) {
      results.push({ note, score, reasons });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return options.limit ? results.slice(0, options.limit) : results;
}
