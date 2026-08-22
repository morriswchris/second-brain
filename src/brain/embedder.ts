/**
 * Embeddings for topical search.
 *
 * The real implementation is an on-device embedding model (e.g. MiniLM /
 * EmbeddingGemma via react-native-executorch) exposed through the `Embedder`
 * interface. Search only ever depends on the interface, so that model drops in
 * without touching anything else.
 *
 * Shipped here is a deterministic, dependency-free stand-in: a hashed
 * bag-of-words vector. It captures lexical overlap (not true synonymy), which
 * is enough to exercise and test the ranking pipeline offline and in CI. Swap
 * it for a real model to get semantic matches like "dr" ≈ "doctor".
 */

import type { Embedder } from '@/brain/types';

const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'to',
  'of',
  'and',
  'or',
  'i',
  'my',
  'me',
  'is',
  'it',
  'in',
  'on',
  'at',
  'for',
  'do',
  'have',
  'has',
  'what',
  'when',
  'do',
  'did',
  'need',
  'this',
  'that',
  'was',
  'are',
  'be',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

/** Stable string hash (FNV-1a) → bucket index. */
function hashToBucket(token: string, dimensions: number): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h) % dimensions;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * A deterministic hashed bag-of-words embedder. Placeholder for a real
 * on-device embedding model — same interface, no native dependency.
 */
export function createHashEmbedder(dimensions = 128): Embedder {
  return {
    name: `hash-bow-${dimensions}`,
    dimensions,
    async embed(text: string): Promise<number[]> {
      const vec = new Array<number>(dimensions).fill(0);
      for (const token of tokenize(text)) {
        vec[hashToBucket(token, dimensions)] += 1;
      }
      // L2 normalize so cosine is well-behaved.
      const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
      if (norm > 0) {
        for (let i = 0; i < dimensions; i++) vec[i] /= norm;
      }
      return vec;
    },
  };
}
