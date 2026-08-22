import { buildEnrichedNote } from '@/brain/enrich';
import { createHashEmbedder } from '@/brain/embedder';
import { createHeuristicProvider } from '@/brain/providers/heuristic';
import { search } from '@/brain/search';
import type { EnrichedNote } from '@/brain/types';

const CAPTURE = Date.parse('2026-08-19T12:00:00Z');
const embedder = createHashEmbedder();
const provider = createHeuristicProvider();

const NOTE_TEXTS: [string, string][] = [
  ['n1', 'next Monday I have a dr appointment'],
  ['n4', 'finish the Q3 report by Friday'],
  ['n5', 'buy milk, eggs, bread'],
  ['n8', 'Sarah recommended Atomic Habits'],
];

async function buildNotes(): Promise<EnrichedNote[]> {
  return Promise.all(
    NOTE_TEXTS.map(([id, text]) =>
      buildEnrichedNote({ id, text, createdAt: CAPTURE, provider, embedder }),
    ),
  );
}

const asked = (iso: string) => Date.parse(`${iso}T09:00:00Z`);
const ids = (results: { note: EnrichedNote }[]) => results.map((r) => r.note.id);

describe('search — temporal queries', () => {
  it('returns the "next Monday" note when asked "what do I have today?" on that Monday', async () => {
    const notes = await buildNotes();
    const results = await search(
      'what do I have to do today?',
      notes,
      embedder,
      asked('2026-08-31'),
    );
    expect(ids(results)).toEqual(['n1']);
    expect(results[0].reasons.join(' ')).toMatch(/today/);
  });

  it('excludes that same note on an unrelated day', async () => {
    const notes = await buildNotes();
    const results = await search('what do I have today?', notes, embedder, asked('2026-08-20'));
    expect(ids(results)).not.toContain('n1');
  });
});

describe('search — topical queries', () => {
  it('matches "doctor" to a note that only said "dr"', async () => {
    const notes = await buildNotes();
    const results = await search('when is my doctor appointment?', notes, embedder, CAPTURE);
    expect(ids(results.slice(0, 1))).toEqual(['n1']);
  });

  it('bridges "store" to "milk, eggs, bread" via the shared shopping tag', async () => {
    const notes = await buildNotes();
    const results = await search('what do I need from the store?', notes, embedder, CAPTURE);
    expect(ids(results)).toContain('n5');
  });

  it('finds a note by a person mentioned as the subject', async () => {
    const notes = await buildNotes();
    const results = await search('what did Sarah recommend?', notes, embedder, CAPTURE);
    expect(ids(results.slice(0, 1))).toEqual(['n8']);
  });

  it('respects the result limit', async () => {
    const notes = await buildNotes();
    const results = await search('report', notes, embedder, CAPTURE, { limit: 1 });
    expect(results.length).toBeLessThanOrEqual(1);
  });
});
