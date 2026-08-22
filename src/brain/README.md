# `brain` — enrichment + search intelligence layer

Turns raw captured notes into structured metadata at capture time and answers
natural-language questions over them. The model is always behind an interface
(`EnrichmentProvider` / `Embedder`), so a rule-based baseline, an on-device LLM,
or a cloud model are interchangeable — and the eval harness scores them against
each other.

```
capture ─▶ buildEnrichedNote(provider, embedder) ─▶ store
query   ─▶ search(query, notes, embedder, now)   ─▶ ranked results
```

Design rules that matter:

- **Enrichment never blocks capture** and never throws — a failing provider
  falls back to deterministic metadata.
- **Dates are resolved deterministically from the note text** (`dates.ts`),
  never left to the model. A model-supplied date is accepted only when the text
  names a date the resolver can't parse, and never hallucinated onto dateless
  notes (`schema.ts`).
- **Search is hybrid**: a deterministic date-window filter + topical embedding
  rank with shared-tag bridging (`search.ts`).

## Testing

Two layers, because one half is deterministic and the other is a model.

### `npm test` — deterministic unit tests (CI)

Covers dates, schema coercion, providers, the enrichment contract, search, and
the eval harness itself. No model, no network, fully reproducible.

### `npm run eval` — non-deterministic eval (synthetic)

Runs the whole enrich→search pipeline over the golden dataset (`evals/dataset.ts`)
many times and checks **aggregate scores against pass-rate thresholds**, not
exact equality — the right shape for testing something non-deterministic. It
includes a seeded `NoisyProvider` that simulates LLM variance, and demonstrates
that deterministically-resolved dates stay pinned even as model-driven fields
degrade under noise.

### `npm run eval:model` — real models (local)

Scores real models through the **same** harness and prints a comparison matrix:

| config     | provider        | embedder        | isolates            |
| ---------- | --------------- | --------------- | ------------------- |
| `baseline` | heuristic rules | hash bag-of-words | deterministic floor |
| `minilm`   | heuristic rules | MiniLM (real)   | the **search** upgrade   |
| `haiku`    | Claude Haiku    | hash            | **extraction** quality   |
| `full`     | Claude Haiku    | MiniLM          | both real           |

Any config whose model isn't reachable is **skipped with a reason** (not a
failure). Only the offline `baseline` gates the exit code, so this is safe to
run anywhere; real-model scores are informational.

**Requirements per config:**

- `minilm` / `full` — network access to the Hugging Face hub on first run (to
  fetch `all-MiniLM-L6-v2`, ~90 MB, then cached). For a fully-offline run,
  pre-download the model and set `BRAIN_EMBED_MODEL_PATH=/path/to/all-MiniLM-L6-v2`.
- `haiku` / `full` — Anthropic credentials (`ANTHROPIC_API_KEY`, or an
  `ant auth login` profile). Without them these two skip cleanly.

**Env vars:** `BRAIN_EMBED_MODEL`, `BRAIN_EMBED_MODEL_PATH`, `BRAIN_LLM_MODEL`
(default `claude-haiku-4-5`), `BRAIN_EVAL_TRIALS` (default 3 for model configs).

> Note: in a sandbox where the HF hub is blocked and no API key is set, only
> `baseline` runs; the real configs report why they skipped. Run it on a
> machine with hub access / a key to populate the matrix.

## Swapping in the on-device model

Production wiring replaces the two stand-ins with real on-device implementations
behind the same interfaces:

- **Embedder** → MiniLM / EmbeddingGemma via `react-native-executorch`
  (`embedder.ts` is the lexical placeholder; `evals/models/transformers-embedder.ts`
  is the Node reference).
- **EnrichmentProvider** → a small local LLM via executorch / llama.rn, using
  the prompt + JSON contract in `providers/llm.ts`.

The `evals/models/` implementations are **Node-only** (they pull heavy
native/ESM deps) and must never be imported by the app or the jest-expo tests —
only the `tsx` runner loads them.

## On frameworks

The threshold harness here is deliberately small. If the eval surface grows
(LLM-as-judge scoring, a comparison UI, many prompt variants), **promptfoo** is
the established config-driven framework to graduate to — it can wrap the same
providers. Not needed yet.
