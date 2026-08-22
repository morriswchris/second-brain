/**
 * Validation + coercion of untrusted provider output into `NoteMetadata`.
 *
 * A provider (especially an LLM) can return anything: wrong types, extra keys,
 * a hallucinated date, an out-of-vocabulary kind. Nothing from a provider is
 * trusted directly — it all passes through here first. Two rules matter most:
 *
 *   1. Unknown/invalid values degrade to safe defaults rather than throwing.
 *   2. Dates are reconciled: if the note's text contains a resolvable date, the
 *      deterministic resolver wins over whatever the model said. We only fall
 *      back to the model's date when the text has no anchor we can resolve.
 */

import {
  NOTE_KINDS,
  PRIORITIES,
  SCHEMA_VERSION,
  type EnrichmentInput,
  type NoteKind,
  type NoteMetadata,
  type Priority,
  type RawMetadata,
} from '@/brain/types';
import { resolveRecurrence, resolveRelativeDate } from '@/brain/dates';

function coerceKind(value: unknown): NoteKind {
  return typeof value === 'string' && (NOTE_KINDS as readonly string[]).includes(value)
    ? (value as NoteKind)
    : 'note';
}

function coercePriority(value: unknown): Priority {
  return typeof value === 'string' && (PRIORITIES as readonly string[]).includes(value)
    ? (value as Priority)
    : 'normal';
}

function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const cleaned = value
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim().toLowerCase())
    .filter((v) => v.length > 0);
  return Array.from(new Set(cleaned));
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function coerceIsoOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return ISO_DATE.test(trimmed) ? trimmed : null;
}

/**
 * Words/patterns that signal the text refers to *some* date the deterministic
 * resolver doesn't yet cover (month names, numeric dates, ordinals). Used to
 * decide whether a model-provided date is even plausible.
 */
const DATE_HINT =
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b|\b\d{1,2}\/\d{1,2}\b|\b\d{1,2}(st|nd|rd|th)\b/i;

/**
 * Reconcile the note's date. Three tiers, in order of trust:
 *   1. The deterministic resolver wins whenever the text has a date it
 *      understands ("next Monday", "tomorrow") — never the model's arithmetic.
 *   2. Otherwise, only if the text actually mentions a date the resolver can't
 *      parse ("April 15"), accept a valid ISO date from the provider.
 *   3. If the text has no date signal at all, force null — so a model can never
 *      hallucinate a due date onto "buy milk, eggs, bread".
 */
function reconcileDate(raw: RawMetadata, input: EnrichmentInput): string | null {
  const deterministic = resolveRelativeDate(input.text, input.now);
  if (deterministic !== null) return deterministic;
  if (DATE_HINT.test(input.text)) return coerceIsoOrNull(raw.dueDate);
  return null;
}

function coerceRecurrence(raw: RawMetadata, input: EnrichmentInput): string | null {
  const deterministic = resolveRecurrence(input.text);
  if (deterministic !== null) return deterministic;
  return typeof raw.recurrence === 'string' && raw.recurrence.trim().length > 0
    ? raw.recurrence.trim().toLowerCase()
    : null;
}

/** Coerce raw provider output into safe, typed metadata. Never throws. */
export function coerceMetadata(raw: RawMetadata, input: EnrichmentInput): NoteMetadata {
  return {
    kind: coerceKind(raw.kind),
    dueDate: reconcileDate(raw, input),
    recurrence: coerceRecurrence(raw, input),
    people: coerceStringArray(raw.people),
    topics: coerceStringArray(raw.topics),
    priority: coercePriority(raw.priority),
    schemaVersion: SCHEMA_VERSION,
  };
}

/**
 * Minimal metadata used when a provider fails entirely. Capture is never
 * blocked by enrichment, so a note must still be storable and (date-)findable
 * even if the model is unavailable — the deterministic date resolver still runs.
 */
export function fallbackMetadata(input: EnrichmentInput): NoteMetadata {
  return coerceMetadata({}, input);
}
