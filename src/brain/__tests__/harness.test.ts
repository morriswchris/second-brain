/**
 * Regression coverage for the eval harness itself, kept in `npm test` so the
 * golden dataset and scoring stay green in CI without needing any model. The
 * model-backed matrix (`npm run eval:model`) reuses this exact harness.
 */

import { createHashEmbedder } from '@/brain/embedder';
import { createHeuristicProvider } from '@/brain/providers/heuristic';
import { createLlmProvider } from '@/brain/providers/llm';
import { runEvalSuite } from '@/brain/evals/harness';

const embedder = createHashEmbedder();

describe('eval harness', () => {
  it('scores the deterministic heuristic baseline at 100%', async () => {
    const report = await runEvalSuite(() => createHeuristicProvider(), embedder, { trials: 1 });
    expect(report.enrichment.kind).toBe(1);
    expect(report.enrichment.date).toBe(1);
    expect(report.query.recall).toBe(1);
    expect(report.overall).toBe(1);
  });

  it('keeps dates correct even when an LLM returns garbage metadata', async () => {
    // A "model" that hallucinates a wrong kind and a wrong date for everything.
    const badLlm = createLlmProvider(
      async () => '{"kind":"idea","dueDate":"1999-01-01","topics":[],"people":[]}',
      'bad-llm',
    );
    const report = await runEvalSuite(() => badLlm, embedder, { trials: 1 });
    // Deterministic resolution overrides the model for every note whose text has
    // a date it understands, so date accuracy stays near-perfect. The only leak
    // is a note that names a date the resolver can't parse ("April 15"), where
    // the model's (wrong) date is trusted — exactly the gap chrono-node closes.
    expect(report.enrichment.date).toBeGreaterThanOrEqual(0.85);
    // Kind is purely the model's, so a garbage model tanks it across the board.
    expect(report.enrichment.kind).toBeLessThan(0.3);
  });
});
