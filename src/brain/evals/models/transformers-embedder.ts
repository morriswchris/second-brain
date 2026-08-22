/**
 * A real, offline embedding model exposed through the module's `Embedder`
 * interface — the semantic upgrade over the lexical hash stand-in.
 *
 * It runs `all-MiniLM-L6-v2` (384-dim) via @huggingface/transformers, the same
 * class of small model that would run on-device through executorch. This is the
 * honest test of "will local semantic search find my dr appointment by meaning."
 *
 * NODE-ONLY. This file must never be imported by the React Native app or the
 * jest-expo unit tests — it dynamically imports a heavy native/ESM dependency.
 * It's loaded only by the tsx eval runner (`npm run eval:model`).
 *
 * Model weights are fetched from the Hugging Face hub on first use and cached.
 * For a fully-offline run (or an environment that blocks the hub), pre-download
 * the model and point `BRAIN_EMBED_MODEL_PATH` at the local directory.
 */

import type { Embedder } from '@/brain/types';

export interface TransformersEmbedderOptions {
  /** Model id on the HF hub, or a local path. */
  model?: string;
}

const DEFAULT_MODEL = 'Xenova/all-MiniLM-L6-v2';

export async function createTransformersEmbedder(
  options: TransformersEmbedderOptions = {},
): Promise<Embedder> {
  const model =
    options.model ?? process.env.BRAIN_EMBED_MODEL_PATH ?? process.env.BRAIN_EMBED_MODEL ?? DEFAULT_MODEL;

  // Dynamic import keeps this dependency out of any bundle that merely imports
  // the brain module; only the eval runner pays for it.
  const { pipeline, env } = await import('@huggingface/transformers');

  // Let CI point the model cache at a stable, cacheable path (the default lives
  // inside node_modules, which `npm ci` wipes each run).
  if (process.env.BRAIN_MODEL_CACHE) {
    env.cacheDir = process.env.BRAIN_MODEL_CACHE;
  }

  // If a local path is given, run without touching the network.
  if (options.model?.startsWith('/') || process.env.BRAIN_EMBED_MODEL_PATH) {
    env.allowRemoteModels = false;
  }

  const extractor = await pipeline('feature-extraction', model);

  const embed = async (text: string): Promise<number[]> => {
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data as Float32Array);
  };

  // Probe once to learn the dimensionality.
  const dimensions = (await embed('dimension probe')).length;

  return { name: `transformers:${model}`, dimensions, embed };
}
