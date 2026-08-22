/**
 * Deterministic date handling — the layer that makes "what do I have today?"
 * actually return the note captured as "next Monday I have a dr appointment".
 *
 * All arithmetic is done in UTC so results are stable regardless of the
 * machine's timezone (important for reproducible tests and evals). A note's
 * relative date is resolved *once* against its capture time; query windows are
 * resolved against "now". No model is ever asked to do calendar math.
 *
 * In production, `resolveRelativeDate` is the place to swap in `chrono-node`
 * for broader coverage; the deterministic contract stays the same.
 */

const DAY_MS = 86_400_000;

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/** ISO `YYYY-MM-DD` for an epoch-ms instant, in UTC. */
export function isoDate(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10);
}

/** Midnight-UTC epoch ms for the day containing `epochMs`. */
export function startOfUtcDay(epochMs: number): number {
  const d = new Date(epochMs);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function addDaysIso(epochMs: number, days: number): string {
  return isoDate(startOfUtcDay(epochMs) + days * DAY_MS);
}

/**
 * Days until the next occurrence of `targetWeekday` (0=Sun..6=Sat), in the
 * range 1..7. The current weekday maps to 7 (a week away), since "Monday" said
 * on a Monday almost always means the coming one, not today.
 */
function daysUntilWeekday(fromEpochMs: number, targetWeekday: number): number {
  const todayWd = new Date(startOfUtcDay(fromEpochMs)).getUTCDay();
  const delta = (targetWeekday - todayWd + 7) % 7;
  return delta === 0 ? 7 : delta;
}

/**
 * Resolve the first relative/explicit date phrase in `text` to an ISO date,
 * anchored to `now`. Returns null when there's no temporal anchor.
 *
 * Semantics (documented deliberately so behavior is predictable):
 *   - "today" / "tonight"        → the capture day
 *   - "tomorrow"                 → +1 day
 *   - "yesterday"                → -1 day
 *   - "in N days"                → +N days
 *   - "this <weekday>" / bare    → the coming occurrence (1..7 days out)
 *   - "next <weekday>"           → the coming occurrence + 7 (the following week)
 *   - explicit ISO "YYYY-MM-DD"  → used as-is
 */
export function resolveRelativeDate(text: string, now: number): string | null {
  const t = text.toLowerCase();

  const iso = t.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];

  if (/\btoday\b|\btonight\b/.test(t)) return addDaysIso(now, 0);
  if (/\btomorrow\b/.test(t)) return addDaysIso(now, 1);
  if (/\byesterday\b/.test(t)) return addDaysIso(now, -1);

  const inDays = t.match(/\bin (\d{1,3}) days?\b/);
  if (inDays) return addDaysIso(now, Number(inDays[1]));

  const wd = t.match(
    /\b(next|this)?\s*(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/,
  );
  if (wd) {
    const modifier = wd[1];
    const base = daysUntilWeekday(now, WEEKDAYS[wd[2]]);
    const days = modifier === 'next' ? base + 7 : base;
    return addDaysIso(now, days);
  }

  return null;
}

/** Extract a recurrence phrase ("every other tuesday", "every day"), or null. */
export function resolveRecurrence(text: string): string | null {
  const m = text
    .toLowerCase()
    .match(
      /\bevery\s+(other\s+)?(day|week|month|year|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/,
    );
  return m ? m[0] : null;
}

export interface DateWindow {
  /** Inclusive ISO lower bound, or null for open-ended (overdue). */
  fromIso: string | null;
  /** Inclusive ISO upper bound. */
  toIso: string;
  label: string;
}

/**
 * Parse a time window out of a natural-language query, anchored to `now`.
 * Returns null when the query isn't asking about time at all (a purely topical
 * query like "what did Sarah recommend").
 */
export function parseDateWindow(query: string, now: number): DateWindow | null {
  const q = query.toLowerCase();
  const today = addDaysIso(now, 0);

  if (/\boverdue\b|\blate\b|\bbehind\b/.test(q)) {
    return { fromIso: null, toIso: addDaysIso(now, -1), label: 'overdue' };
  }
  if (/\btoday\b|\btonight\b/.test(q)) {
    return { fromIso: today, toIso: today, label: 'today' };
  }
  if (/\btomorrow\b/.test(q)) {
    const d = addDaysIso(now, 1);
    return { fromIso: d, toIso: d, label: 'tomorrow' };
  }
  if (/\bthis week\b|\bthis weekend\b/.test(q)) {
    return { fromIso: today, toIso: addDaysIso(now, 7), label: 'this week' };
  }
  if (/\bnext week\b/.test(q)) {
    return { fromIso: addDaysIso(now, 7), toIso: addDaysIso(now, 14), label: 'next week' };
  }
  return null;
}

/** Is `dateIso` within `window` (inclusive)? Null dates never match. */
export function isWithinWindow(dateIso: string | null, window: DateWindow): boolean {
  if (dateIso === null) return false;
  if (window.fromIso !== null && dateIso < window.fromIso) return false;
  return dateIso <= window.toIso;
}
