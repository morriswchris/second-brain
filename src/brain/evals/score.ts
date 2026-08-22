/**
 * Scoring functions for the eval harness.
 *
 * These turn a single run's output into numbers we can average across many runs
 * — the essence of testing something non-deterministic. Nothing here asserts;
 * the harness aggregates these scores and applies thresholds.
 */

import type { NoteMetadata, SearchResult } from '@/brain/types';
import type { NoteFixture } from '@/brain/evals/dataset';

export interface EnrichmentScore {
  kind: number; // 1 if correct, else 0
  date: number; // 1 if resolved date matches expectation exactly
  topics: number; // 1 if all required topics present
  people: number; // 1 if all required people present
}

export function scoreEnrichment(fixture: NoteFixture, actual: NoteMetadata): EnrichmentScore {
  const e = fixture.expect;
  const hasAll = (required: string[] | undefined, got: string[]) =>
    !required || required.every((r) => got.includes(r)) ? 1 : 0;

  return {
    kind: actual.kind === e.kind ? 1 : 0,
    date: actual.dueDate === e.dueDate ? 1 : 0,
    topics: hasAll(e.topics, actual.topics),
    people: hasAll(e.people, actual.people),
  };
}

/** Fraction of expected note ids that appear in the top-k results. */
export function recallAtK(expectedIds: string[], results: SearchResult[], k: number): number {
  if (expectedIds.length === 0) return 1;
  const top = new Set(results.slice(0, k).map((r) => r.note.id));
  const found = expectedIds.filter((id) => top.has(id)).length;
  return found / expectedIds.length;
}

export function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((s, v) => s + v, 0) / values.length;
}
