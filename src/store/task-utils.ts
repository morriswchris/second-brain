import type { Task } from '@/store/types';

/** Collapse internal whitespace and trim. Used for both display and validation. */
export function normalizeTitle(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

/** A task needs a non-empty title after normalization. */
export function isValidTitle(raw: string): boolean {
  return normalizeTitle(raw).length > 0;
}

/** Reasonably-unique id without pulling in a uuid dependency (local-only data). */
export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/** Build a fresh, active task. Pure: id and clock are injected for testability. */
export function buildTask(rawTitle: string, opts: { id: string; now: number }): Task {
  return {
    id: opts.id,
    title: normalizeTitle(rawTitle),
    notes: '',
    done: false,
    important: false,
    createdAt: opts.now,
    completedAt: null,
  };
}

/** Active tasks: important first, then most recently created. */
export function sortActive(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => !t.done)
    .sort((a, b) => Number(b.important) - Number(a.important) || b.createdAt - a.createdAt);
}

/** Completed tasks: most recently completed first. */
export function sortCompleted(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.done)
    .sort((a, b) => (b.completedAt ?? b.createdAt) - (a.completedAt ?? a.createdAt));
}

export function partitionTasks(tasks: Task[]): { active: Task[]; completed: Task[] } {
  return { active: sortActive(tasks), completed: sortCompleted(tasks) };
}
