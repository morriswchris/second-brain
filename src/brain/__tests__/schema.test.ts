import { coerceMetadata, fallbackMetadata } from '@/brain/schema';
import { SCHEMA_VERSION, type EnrichmentInput } from '@/brain/types';

const NOW = Date.parse('2026-08-19T12:00:00Z');
const input = (text: string): EnrichmentInput => ({ text, now: NOW });

describe('coerceMetadata date reconciliation', () => {
  it('lets the deterministic resolver override a wrong model date', () => {
    const meta = coerceMetadata({ dueDate: '2099-01-01' }, input('remind me tomorrow'));
    expect(meta.dueDate).toBe('2026-08-20'); // resolver wins, model ignored
  });

  it('accepts a model date only when the text hints at an unparseable date', () => {
    const meta = coerceMetadata({ dueDate: '2026-04-15' }, input('submit taxes before April 15'));
    expect(meta.dueDate).toBe('2026-04-15');
  });

  it('refuses to let the model hallucinate a date onto dateless text', () => {
    const meta = coerceMetadata({ dueDate: '2026-07-04' }, input('buy milk, eggs, bread'));
    expect(meta.dueDate).toBeNull();
  });
});

describe('coerceMetadata field coercion', () => {
  it('falls back to safe defaults for invalid enums', () => {
    const meta = coerceMetadata({ kind: 'nonsense', priority: 42 }, input('x'));
    expect(meta.kind).toBe('note');
    expect(meta.priority).toBe('normal');
  });

  it('cleans, lowercases and dedupes string arrays', () => {
    const meta = coerceMetadata(
      { topics: ['Work', 'work', ' health ', 7, ''], people: ['Sarah'] },
      input('x'),
    );
    expect(meta.topics).toEqual(['work', 'health']);
    expect(meta.people).toEqual(['sarah']);
  });

  it('ignores non-array topic/people values', () => {
    const meta = coerceMetadata({ topics: 'work', people: null }, input('x'));
    expect(meta.topics).toEqual([]);
    expect(meta.people).toEqual([]);
  });

  it('stamps the schema version', () => {
    expect(coerceMetadata({}, input('x')).schemaVersion).toBe(SCHEMA_VERSION);
  });
});

describe('fallbackMetadata', () => {
  it('still resolves the date deterministically when a provider fails', () => {
    const meta = fallbackMetadata(input('dentist tomorrow'));
    expect(meta.dueDate).toBe('2026-08-20');
    expect(meta.kind).toBe('note');
  });
});
