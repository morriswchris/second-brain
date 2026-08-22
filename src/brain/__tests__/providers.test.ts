import { buildPrompt, createLlmProvider, extractJson } from '@/brain/providers/llm';
import { createHeuristicProvider } from '@/brain/providers/heuristic';
import { createNoisyProvider } from '@/brain/evals/noisy-provider';

const NOW = Date.parse('2026-08-19T12:00:00Z');

describe('heuristic provider', () => {
  const provider = createHeuristicProvider();

  it('classifies kinds', async () => {
    expect((await provider.enrich({ text: 'dr appointment', now: NOW })).kind).toBe('appointment');
    expect((await provider.enrich({ text: 'buy milk', now: NOW })).kind).toBe('shopping');
    expect((await provider.enrich({ text: 'idea: a new feature', now: NOW })).kind).toBe('idea');
    expect((await provider.enrich({ text: 'finish the report', now: NOW })).kind).toBe('task');
  });

  it('extracts people from cue and subject positions', async () => {
    expect((await provider.enrich({ text: 'call Sarah', now: NOW })).people).toContain('sarah');
    expect(
      (await provider.enrich({ text: 'Sarah recommended a book', now: NOW })).people,
    ).toContain('sarah');
  });
});

describe('llm provider plumbing', () => {
  it('buildPrompt anchors on today', () => {
    expect(buildPrompt({ text: 'x', now: NOW })).toContain('2026-08-19');
  });

  it('extractJson tolerates prose and code fences', () => {
    expect(extractJson('Sure! ```json\n{"kind":"task"}\n```')).toEqual({ kind: 'task' });
    expect(extractJson('here you go {"kind":"idea","topics":["work"]} done')).toEqual({
      kind: 'idea',
      topics: ['work'],
    });
  });

  it('extractJson returns {} on unparseable output', () => {
    expect(extractJson('no json here')).toEqual({});
    expect(extractJson('{ broken')).toEqual({});
  });

  it('wraps an injected complete() into a provider', async () => {
    const provider = createLlmProvider(async () => '{"kind":"appointment"}');
    expect((await provider.enrich({ text: 'x', now: NOW })).kind).toBe('appointment');
  });
});

describe('noisy provider', () => {
  it('is reproducible for a given seed', async () => {
    const make = () => createNoisyProvider(createHeuristicProvider(), { flipKind: 0.5, seed: 7 });
    const a = await make().enrich({ text: 'buy milk', now: NOW });
    const b = await make().enrich({ text: 'buy milk', now: NOW });
    expect(a).toEqual(b);
  });
});
