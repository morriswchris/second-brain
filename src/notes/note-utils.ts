import type { Note } from '@/notes/types';

/**
 * Pure helpers for notes — no I/O, no React — so they can be unit-tested
 * directly and reused by the store, the repository, and the UI.
 */

/**
 * A collision-resistant id that needs no native crypto (Expo Go / web / tests
 * all lack a guaranteed `crypto.randomUUID`). Timestamp keeps ids roughly
 * sortable; the random suffix disambiguates captures within the same ms.
 */
export function makeNoteId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Build a Note from raw user input. Returns `null` when there's nothing worth
 * capturing (empty / whitespace-only), so callers can no-op silently.
 */
export function createNote(text: string, now: number = Date.now()): Note | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;
  return { id: makeNoteId(), text: trimmed, createdAt: now };
}

/** Newest first — the order a brain-dump list should read in. */
export function sortNotesByNewest(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Compact relative time ("just now", "5m", "3h", "2d"), falling back to a
 * short date for anything older than a week. Kept terse on purpose — the list
 * is for scanning, not reading timestamps.
 */
export function formatRelativeTime(createdAt: number, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - createdAt) / 1000));
  if (seconds < 45) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** A run of notes captured on the same local calendar day. */
export type NoteSection = {
  /** Stable key for the day, `YYYY-M-D` in local time. */
  key: string;
  /** Human label: "Today", "Yesterday", a weekday this week, else a date. */
  title: string;
  data: Note[];
};

function dayKey(time: number): string {
  const d = new Date(time);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function startOfDay(time: number): number {
  const d = new Date(time);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Label for the day a note was captured, relative to `now`. */
export function formatDayLabel(time: number, now: number = Date.now()): string {
  const diffDays = Math.round((startOfDay(now) - startOfDay(time)) / 86_400_000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return new Date(time).toLocaleDateString(undefined, { weekday: 'long' });

  const sameYear = new Date(time).getFullYear() === new Date(now).getFullYear();
  return new Date(time).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/**
 * Split newest-first notes into per-day sections (for a `SectionList`),
 * preserving order within and across days.
 */
export function groupNotesByDay(notes: Note[], now: number = Date.now()): NoteSection[] {
  const sections: NoteSection[] = [];
  for (const note of notes) {
    const key = dayKey(note.createdAt);
    const last = sections[sections.length - 1];
    if (last && last.key === key) {
      last.data.push(note);
    } else {
      sections.push({ key, title: formatDayLabel(note.createdAt, now), data: [note] });
    }
  }
  return sections;
}
