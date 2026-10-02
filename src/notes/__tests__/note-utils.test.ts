import {
  createNote,
  formatDayLabel,
  formatRelativeTime,
  groupNotesByDay,
  makeNoteId,
  sortNotesByNewest,
} from '@/notes/note-utils';
import type { Note } from '@/notes/types';

describe('createNote', () => {
  it('trims input and stamps the provided time', () => {
    const note = createNote('  buy milk  ', 1000);
    expect(note).not.toBeNull();
    expect(note?.text).toBe('buy milk');
    expect(note?.createdAt).toBe(1000);
    expect(note?.id).toEqual(expect.any(String));
  });

  it('returns null for empty or whitespace-only input', () => {
    expect(createNote('')).toBeNull();
    expect(createNote('   \n\t ')).toBeNull();
  });
});

describe('makeNoteId', () => {
  it('produces unique ids across rapid calls', () => {
    const ids = new Set(Array.from({ length: 500 }, () => makeNoteId()));
    expect(ids.size).toBe(500);
  });
});

describe('sortNotesByNewest', () => {
  it('orders newest first without mutating the input', () => {
    const input: Note[] = [
      { id: 'a', text: 'old', createdAt: 1 },
      { id: 'b', text: 'new', createdAt: 3 },
      { id: 'c', text: 'mid', createdAt: 2 },
    ];
    const sorted = sortNotesByNewest(input);

    expect(sorted.map((n) => n.id)).toEqual(['b', 'c', 'a']);
    // original order preserved (pure function)
    expect(input.map((n) => n.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('formatRelativeTime', () => {
  const now = 1_000_000_000_000;

  it('renders recent captures as "just now"', () => {
    expect(formatRelativeTime(now - 5_000, now)).toBe('just now');
  });

  it('renders minutes, hours, and days compactly', () => {
    expect(formatRelativeTime(now - 5 * 60_000, now)).toBe('5m');
    expect(formatRelativeTime(now - 3 * 3_600_000, now)).toBe('3h');
    expect(formatRelativeTime(now - 2 * 86_400_000, now)).toBe('2d');
  });

  it('falls back to a short date beyond a week', () => {
    const result = formatRelativeTime(now - 10 * 86_400_000, now);
    expect(result).not.toMatch(/just now|\d+[mhd]$/);
  });
});

describe('formatDayLabel', () => {
  // Local-time noon on Wed 1 Oct 2025, so day maths is DST/timezone-safe.
  const now = new Date(2025, 9, 1, 12).getTime();

  it('labels today and yesterday', () => {
    expect(formatDayLabel(new Date(2025, 9, 1, 0, 5).getTime(), now)).toBe('Today');
    expect(formatDayLabel(new Date(2025, 8, 30, 23, 59).getTime(), now)).toBe('Yesterday');
  });

  it('uses a weekday within the last week and a date beyond it', () => {
    const fourDaysAgo = new Date(2025, 8, 27, 9).getTime();
    expect(formatDayLabel(fourDaysAgo, now)).toBe(
      new Date(fourDaysAgo).toLocaleDateString(undefined, { weekday: 'long' }),
    );
    expect(formatDayLabel(new Date(2025, 8, 1).getTime(), now)).not.toMatch(/Today|Yesterday/);
  });
});

describe('groupNotesByDay', () => {
  const now = new Date(2025, 9, 1, 12).getTime();
  const at = (day: number, hour: number) => new Date(2025, 9, day, hour).getTime();

  it('groups newest-first notes into ordered day sections', () => {
    const notes: Note[] = [
      { id: 'a', text: 'a', createdAt: at(1, 11) },
      { id: 'b', text: 'b', createdAt: at(1, 8) },
      { id: 'c', text: 'c', createdAt: at(0, 20) },
    ];

    const sections = groupNotesByDay(notes, now);

    expect(sections.map((s) => s.title)).toEqual(['Today', 'Yesterday']);
    expect(sections[0].data.map((n) => n.id)).toEqual(['a', 'b']);
    expect(sections[1].data.map((n) => n.id)).toEqual(['c']);
  });

  it('returns no sections for no notes', () => {
    expect(groupNotesByDay([], now)).toEqual([]);
  });
});
