/**
 * A provider wrapper that injects realistic LLM-style variance into a base
 * provider's output, so the eval harness exercises the pipeline the way a real
 * non-deterministic model would.
 *
 * The randomness is seeded (mulberry32) so a run is reproducible given a seed,
 * while different seeds across trials produce the spread we average over.
 *
 * Note what it demonstrates: `jitterDate` corrupts the *raw* dueDate, but
 * `coerceMetadata` overrides it with the deterministic resolver whenever the
 * note's text has a resolvable date. So date accuracy for those notes stays
 * pinned at 100% even under heavy noise — the whole point of resolving dates
 * deterministically instead of trusting the model.
 */

import { NOTE_KINDS } from '@/brain/types';
import type { EnrichmentInput, EnrichmentProvider, RawMetadata } from '@/brain/types';

export interface NoiseConfig {
  /** Probability of replacing kind with a random wrong one. */
  flipKind?: number;
  /** Probability of overwriting dueDate with a bogus ISO date. */
  jitterDate?: number;
  /** Probability of dropping one topic. */
  dropTopic?: number;
  /** Probability of dropping one person. */
  dropPerson?: number;
  seed?: number;
}

/** Small, fast, seedable PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createNoisyProvider(
  base: EnrichmentProvider,
  config: NoiseConfig = {},
): EnrichmentProvider {
  const rand = mulberry32(config.seed ?? 1);
  const p = {
    flipKind: config.flipKind ?? 0,
    jitterDate: config.jitterDate ?? 0,
    dropTopic: config.dropTopic ?? 0,
    dropPerson: config.dropPerson ?? 0,
  };

  return {
    name: `noisy(${base.name})`,
    async enrich(input: EnrichmentInput): Promise<RawMetadata> {
      const raw = { ...(await base.enrich(input)) };

      if (rand() < p.flipKind) {
        raw.kind = NOTE_KINDS[Math.floor(rand() * NOTE_KINDS.length)];
      }
      if (rand() < p.jitterDate) {
        const bogusDay = String(1 + Math.floor(rand() * 28)).padStart(2, '0');
        raw.dueDate = `2026-07-${bogusDay}`;
      }
      if (rand() < p.dropTopic && Array.isArray(raw.topics) && raw.topics.length > 0) {
        raw.topics = (raw.topics as string[]).slice(1);
      }
      if (rand() < p.dropPerson && Array.isArray(raw.people) && raw.people.length > 0) {
        raw.people = (raw.people as string[]).slice(1);
      }
      return raw;
    },
  };
}
