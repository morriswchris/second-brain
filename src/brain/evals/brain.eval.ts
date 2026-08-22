/**
 * Non-deterministic eval suite for the brain module.
 *
 * This is NOT part of `npm test` — it's gated behind `npm run eval` (see the
 * package.json script and `testPathIgnorePatterns` in jest.config.js) because
 * it's a quality benchmark, not a unit test: it runs the pipeline many times
 * and checks aggregate scores against thresholds.
 *
 * Today it scores the deterministic heuristic baseline and a seeded noisy
 * provider that simulates LLM variance. To benchmark a real model, wire its
 * `complete()` into `createLlmProvider` and pass that as the factory — the
 * harness and thresholds stay exactly the same.
 */

import { createHashEmbedder } from '@/brain/embedder';
import { createHeuristicProvider } from '@/brain/providers/heuristic';
import { createNoisyProvider } from '@/brain/evals/noisy-provider';
import { checkThresholds, formatReport, runEvalSuite } from '@/brain/evals/harness';

const embedder = createHashEmbedder();

describe('brain eval suite', () => {
  it('heuristic baseline clears the quality bar', async () => {
    const report = await runEvalSuite(() => createHeuristicProvider(), embedder, { trials: 1 });
    console.log('\n' + formatReport(report));

    expect(
      checkThresholds(report, {
        kind: 1,
        date: 1,
        topics: 1,
        people: 1,
        queryRecall: 1,
        overall: 1,
      }),
    ).toEqual([]);
  });

  it('survives LLM-style noise: dates stay pinned while model fields degrade gracefully', async () => {
    const noise = { flipKind: 0.25, jitterDate: 0.5, dropTopic: 0.25, dropPerson: 0.2 };
    const report = await runEvalSuite(
      (trial) => createNoisyProvider(createHeuristicProvider(), { ...noise, seed: 100 + trial }),
      embedder,
      { trials: 25 },
    );
    console.log('\n' + formatReport(report));

    // The architectural payoff: dates resolved deterministically from the text
    // are immune to model noise. Only date-hinted-but-unparseable notes can leak
    // (the case chrono-node would close), so this stays near-perfect.
    expect(report.enrichment.date).toBeGreaterThanOrEqual(0.9);
    // Retrieval leans on deterministic dates + shared tags, so it holds up.
    expect(checkThresholds(report, { date: 0.9, queryRecall: 0.85 })).toEqual([]);
    // Kind is purely model-driven here, so it should visibly degrade — proving
    // the noise is actually biting and the eval would catch a bad model.
    expect(report.enrichment.kind).toBeLessThan(0.9);
  });
});
