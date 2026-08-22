import { buildEnrichedNote, enrichNote } from '@/brain/enrich';
import { createHashEmbedder } from '@/brain/embedder';
import { createHeuristicProvider } from '@/brain/providers/heuristic';
import type { Embedder, EnrichmentProvider } from '@/brain/types';

const NOW = Date.parse('2026-08-19T12:00:00Z');

const throwingProvider: EnrichmentProvider = {
  name: 'throws',
  async enrich() {
    throw new Error('model unavailable');
  },
};

describe('enrichNote — best-effort contract', () => {
  it('never throws when the provider fails, and still resolves the date', async () => {
    const meta = await enrichNote({ text: 'dentist tomorrow', now: NOW }, throwingProvider);
    expect(meta.dueDate).toBe('2026-08-20');
    expect(meta.kind).toBe('note');
  });

  it('produces validated metadata from a working provider', async () => {
    const meta = await enrichNote(
      { text: 'next Monday I have a dr appointment', now: NOW },
      createHeuristicProvider(),
    );
    expect(meta).toMatchObject({ kind: 'appointment', dueDate: '2026-08-31', topics: ['health'] });
  });
});

describe('buildEnrichedNote', () => {
  it('enriches and embeds in one call', async () => {
    const note = await buildEnrichedNote({
      id: 'x',
      text: 'buy milk',
      createdAt: NOW,
      provider: createHeuristicProvider(),
      embedder: createHashEmbedder(64),
    });
    expect(note.id).toBe('x');
    expect(note.embedding).toHaveLength(64);
    expect(note.metadata.kind).toBe('shopping');
  });

  it('swallows an embedding failure but keeps the note', async () => {
    const brokenEmbedder: Embedder = {
      name: 'broken',
      dimensions: 8,
      async embed() {
        throw new Error('no model');
      },
    };
    const note = await buildEnrichedNote({
      id: 'y',
      text: 'call the dentist tomorrow',
      createdAt: NOW,
      provider: createHeuristicProvider(),
      embedder: brokenEmbedder,
    });
    expect(note.embedding).toBeNull();
    expect(note.metadata.dueDate).toBe('2026-08-20');
  });
});
