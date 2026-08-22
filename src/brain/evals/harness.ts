/**
 * The eval harness — how we test a non-deterministic component.
 *
 * Instead of asserting a single output equals a golden value, it runs the whole
 * enrich→search pipeline over the golden dataset `trials` times and averages the
 * scores. Callers apply *thresholds* to the aggregate (e.g. "kind accuracy ≥
 * 0.8", "date accuracy = 1.0"), which is stable even when the underlying model
 * is not. Point it at the heuristic baseline, a seeded noisy provider, or a real
 * LLM — the harness doesn't care which.
 */

import { buildEnrichedNote } from '@/brain/enrich';
import { search } from '@/brain/search';
import type { Embedder, EnrichedNote, EnrichmentProvider } from '@/brain/types';
import { CAPTURE_NOW, NOTES, QUERIES } from '@/brain/evals/dataset';
import { mean, recallAtK, scoreEnrichment } from '@/brain/evals/score';

export interface EvalReport {
  providerName: string;
  trials: number;
  enrichment: {
    kind: number;
    date: number;
    topics: number;
    people: number;
    overall: number;
  };
  query: {
    recall: number;
    perQuery: { id: string; recall: number }[];
  };
  /** Single headline number: mean of enrichment.overall and query.recall. */
  overall: number;
}

export interface RunOptions {
  trials?: number;
  /** Base seed; trial i uses seed+i so trials differ but reproducibly. */
  seed?: number;
}

/** Build the enriched note set once for a given provider instance. */
async function enrichAll(
  provider: EnrichmentProvider,
  embedder: Embedder,
): Promise<EnrichedNote[]> {
  return Promise.all(
    NOTES.map((f) =>
      buildEnrichedNote({
        id: f.id,
        text: f.text,
        createdAt: CAPTURE_NOW,
        provider,
        embedder,
      }),
    ),
  );
}

export async function runEvalSuite(
  providerFactory: (trial: number) => EnrichmentProvider,
  embedder: Embedder,
  options: RunOptions = {},
): Promise<EvalReport> {
  const trials = options.trials ?? 1;

  const kind: number[] = [];
  const date: number[] = [];
  const topics: number[] = [];
  const people: number[] = [];
  const perQueryRecall: Record<string, number[]> = {};

  let providerName = 'unknown';

  for (let t = 0; t < trials; t++) {
    const provider = providerFactory(t);
    providerName = provider.name;
    const enriched = await enrichAll(provider, embedder);
    const byId = new Map(enriched.map((n) => [n.id, n]));

    for (const fixture of NOTES) {
      const note = byId.get(fixture.id)!;
      const s = scoreEnrichment(fixture, note.metadata);
      kind.push(s.kind);
      date.push(s.date);
      topics.push(s.topics);
      people.push(s.people);
    }

    for (const q of QUERIES) {
      const results = await search(q.query, enriched, embedder, q.now);
      const k = q.topK ?? q.expectNoteIds.length;
      (perQueryRecall[q.id] ??= []).push(recallAtK(q.expectNoteIds, results, k));
    }
  }

  const perQuery = QUERIES.map((q) => ({
    id: q.id,
    recall: mean(perQueryRecall[q.id] ?? []),
  }));
  const queryRecall = mean(perQuery.map((q) => q.recall));

  const enrichment = {
    kind: mean(kind),
    date: mean(date),
    topics: mean(topics),
    people: mean(people),
    overall: mean([mean(kind), mean(date), mean(topics), mean(people)]),
  };

  return {
    providerName,
    trials,
    enrichment,
    query: { recall: queryRecall, perQuery },
    overall: mean([enrichment.overall, queryRecall]),
  };
}

export interface Thresholds {
  kind?: number;
  date?: number;
  topics?: number;
  people?: number;
  queryRecall?: number;
  overall?: number;
}

/** Returns the list of threshold violations (empty = all passed). */
export function checkThresholds(report: EvalReport, thresholds: Thresholds): string[] {
  const failures: string[] = [];
  const check = (name: string, actual: number, min: number | undefined) => {
    if (min !== undefined && actual < min) {
      failures.push(`${name}: ${actual.toFixed(3)} < ${min.toFixed(3)}`);
    }
  };
  check('kind', report.enrichment.kind, thresholds.kind);
  check('date', report.enrichment.date, thresholds.date);
  check('topics', report.enrichment.topics, thresholds.topics);
  check('people', report.enrichment.people, thresholds.people);
  check('queryRecall', report.query.recall, thresholds.queryRecall);
  check('overall', report.overall, thresholds.overall);
  return failures;
}

export function formatReport(report: EvalReport): string {
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const lines = [
    `Provider: ${report.providerName}   trials: ${report.trials}`,
    `  enrichment  kind=${pct(report.enrichment.kind)}  date=${pct(report.enrichment.date)}  topics=${pct(report.enrichment.topics)}  people=${pct(report.enrichment.people)}`,
    `  query recall ${pct(report.query.recall)}`,
    ...report.query.perQuery.map((q) => `    ${q.id.padEnd(14)} ${pct(q.recall)}`),
    `  OVERALL ${pct(report.overall)}`,
  ];
  return lines.join('\n');
}
