/**
 * Model-backed eval runner (run with `npm run eval:model`).
 *
 * Scores real models through the SAME threshold harness as the synthetic Jest
 * eval, so numbers are directly comparable. It runs a small matrix and isolates
 * each upgrade:
 *
 *   baseline  heuristic + hash embedder     — deterministic floor (offline)
 *   minilm    heuristic + MiniLM embeddings — isolates the SEARCH upgrade
 *   haiku     Claude Haiku + hash embedder  — isolates EXTRACTION quality
 *   full      Claude Haiku + MiniLM         — both real
 *
 * Any config whose model isn't reachable here (HF hub blocked, no API key) is
 * skipped with a reason rather than failing the run. The offline `baseline` is
 * the only config whose thresholds gate the exit code — real-model configs are
 * informational, since their scores (and cost) shouldn't break CI.
 *
 * This is a tsx script, deliberately outside Jest, so the model libraries'
 * native/ESM code doesn't fight jest-expo's React Native transform.
 */

import { createHashEmbedder } from '@/brain/embedder';
import { createHeuristicProvider } from '@/brain/providers/heuristic';
import type { Embedder, EnrichmentProvider } from '@/brain/types';
import { checkThresholds, formatReport, runEvalSuite, type EvalReport } from '@/brain/evals/harness';
import { createTransformersEmbedder } from '@/brain/evals/models/transformers-embedder';
import {
  createAnthropicComplete,
  createAnthropicProvider,
} from '@/brain/evals/models/anthropic-provider';
import { createLlmProvider } from '@/brain/providers/llm';

const TRIALS_MODEL = Number(process.env.BRAIN_EVAL_TRIALS ?? 3);

interface ConfigResult {
  name: string;
  report?: EvalReport;
  skipped?: string;
}

async function tryConfig(
  name: string,
  build: () => Promise<{ provider: EnrichmentProvider; embedder: Embedder; trials: number }>,
): Promise<ConfigResult> {
  try {
    const { provider, embedder, trials } = await build();
    const report = await runEvalSuite(() => provider, embedder, { trials });
    return { name, report };
  } catch (error) {
    return { name, skipped: error instanceof Error ? error.message : String(error) };
  }
}

/** Preflight the Anthropic credentials/route so a missing key skips cleanly
 *  instead of silently degrading to fallback metadata inside the harness. */
async function anthropicAvailable(): Promise<string | null> {
  try {
    const complete = await createAnthropicComplete();
    await complete('Reply with the JSON {"ok":true} and nothing else.');
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

async function main(): Promise<void> {
  const hashEmbedder = createHashEmbedder();
  const heuristic = createHeuristicProvider();
  const results: ConfigResult[] = [];

  // 1. Offline baseline — always runs, gates the exit code.
  results.push(
    await tryConfig('baseline (heuristic + hash)', async () => ({
      provider: heuristic,
      embedder: hashEmbedder,
      trials: 1,
    })),
  );

  // 2. Real embeddings — isolates the retrieval upgrade.
  results.push(
    await tryConfig('minilm (heuristic + MiniLM)', async () => ({
      provider: heuristic,
      embedder: await createTransformersEmbedder(),
      trials: 1,
    })),
  );

  // 3/4. Claude configs — only if credentials resolve.
  const anthropicSkip = await anthropicAvailable();
  if (anthropicSkip) {
    results.push({ name: 'haiku (Claude + hash)', skipped: anthropicSkip });
    results.push({ name: 'full (Claude + MiniLM)', skipped: anthropicSkip });
  } else {
    const complete = await createAnthropicComplete();
    const claude = createLlmProvider(
      complete,
      `anthropic:${process.env.BRAIN_LLM_MODEL ?? 'claude-haiku-4-5'}`,
    );
    results.push(
      await tryConfig('haiku (Claude + hash)', async () => ({
        provider: claude,
        embedder: hashEmbedder,
        trials: TRIALS_MODEL,
      })),
    );
    results.push(
      await tryConfig('full (Claude + MiniLM)', async () => ({
        provider: await createAnthropicProvider(),
        embedder: await createTransformersEmbedder(),
        trials: TRIALS_MODEL,
      })),
    );
  }

  // Report.
  console.log('\n================ MODEL EVAL MATRIX ================\n');
  for (const r of results) {
    if (r.skipped) {
      console.log(`• ${r.name}\n    SKIPPED: ${r.skipped}\n`);
    } else if (r.report) {
      console.log(`• ${r.name}`);
      console.log(formatReport(r.report).replace(/^/gm, '  '));
      console.log('');
    }
  }

  // Compact comparison table.
  const rows = results.filter((r) => r.report);
  if (rows.length > 1) {
    const pct = (n: number) => `${(n * 100).toFixed(0)}%`.padStart(5);
    console.log('  config                          kind  date  topic  ppl  recall  OVERALL');
    for (const r of rows) {
      const e = r.report!.enrichment;
      console.log(
        `  ${r.name.padEnd(30)} ${pct(e.kind)} ${pct(e.date)} ${pct(e.topics)} ${pct(e.people)} ${pct(
          r.report!.query.recall,
        )}  ${pct(r.report!.overall)}`,
      );
    }
    console.log('');
  }

  // Exit code: only the offline baseline gates CI.
  const baseline = results.find((r) => r.name.startsWith('baseline'));
  if (baseline?.report) {
    const failures = checkThresholds(baseline.report, {
      kind: 1,
      date: 1,
      topics: 1,
      people: 1,
      queryRecall: 1,
    });
    if (failures.length > 0) {
      console.error('Baseline regressed:', failures.join('; '));
      process.exit(1);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
