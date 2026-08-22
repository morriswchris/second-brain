/**
 * The golden dataset for the brain evals.
 *
 * This is the "will it find my dr appointment?" scenario made concrete: a fixed
 * set of captured notes with the metadata a good enrichment *should* produce,
 * and a set of natural-language queries with the notes they *should* return.
 *
 * Expectations are intentionally loose where a model is allowed to vary (topics
 * are "must contain", not "must equal") and strict where correctness is
 * non-negotiable (the resolved date for "what do I have today?").
 *
 * All notes are captured at the same instant so their resolved dates are
 * predictable; queries carry their own "asked-at" time.
 */

import type { NoteKind } from '@/brain/types';

/** Wed 2026-08-19, 12:00 UTC — the capture instant for every note below. */
export const CAPTURE_NOW = Date.parse('2026-08-19T12:00:00Z');

export interface NoteFixture {
  id: string;
  text: string;
  /** What enrichment should produce. */
  expect: {
    kind: NoteKind;
    /** Exact resolved date, or null. This one is non-negotiable. */
    dueDate: string | null;
    /** Topics that MUST be present (extras allowed). */
    topics?: string[];
    /** People that MUST be present (extras allowed). */
    people?: string[];
    recurrence?: boolean;
  };
}

export const NOTES: NoteFixture[] = [
  {
    id: 'n1',
    text: 'next Monday I have a dr appointment',
    expect: { kind: 'appointment', dueDate: '2026-08-31', topics: ['health'] },
  },
  {
    id: 'n2',
    text: 'pick up dry cleaning tomorrow',
    expect: { kind: 'shopping', dueDate: '2026-08-20' },
  },
  {
    id: 'n3',
    text: 'plumber coming Thursday at 2pm',
    expect: { kind: 'appointment', dueDate: '2026-08-20', topics: ['home'] },
  },
  {
    id: 'n4',
    text: 'finish the Q3 report by Friday',
    expect: { kind: 'task', dueDate: '2026-08-21', topics: ['work'] },
  },
  {
    id: 'n5',
    text: 'buy milk, eggs, bread',
    expect: { kind: 'shopping', dueDate: null, topics: ['shopping'] },
  },
  {
    id: 'n6',
    text: 'take out recycling every other Tuesday',
    expect: { kind: 'task', dueDate: '2026-08-25', topics: ['home'], recurrence: true },
  },
  {
    id: 'n7',
    text: 'important: submit tax docs before April 15',
    expect: { kind: 'task', dueDate: null, topics: ['finance'] },
  },
  {
    id: 'n8',
    text: 'Sarah recommended Atomic Habits',
    expect: { kind: 'fact', dueDate: null, people: ['sarah'] },
  },
  {
    id: 'n9',
    text: 'idea: add voice capture to the app',
    expect: { kind: 'idea', dueDate: null },
  },
];

export interface QueryFixture {
  id: string;
  query: string;
  /** When the question is asked (epoch ms). */
  now: number;
  /** Notes that should appear in the top-k results. */
  expectNoteIds: string[];
  /** k for recall@k; defaults to expectNoteIds.length. */
  topK?: number;
  note?: string;
}

const day = (iso: string) => Date.parse(`${iso}T09:00:00Z`);

export const QUERIES: QueryFixture[] = [
  {
    id: 'q1-today',
    query: 'what do I have to do today?',
    now: day('2026-08-31'), // the Monday the appointment resolved to
    expectNoteIds: ['n1'],
    note: 'The headline case: a temporal query must surface the "next Monday" note.',
  },
  {
    id: 'q2-this-week',
    query: "what's on this week?",
    now: day('2026-08-19'),
    expectNoteIds: ['n2', 'n3', 'n4', 'n6'],
    topK: 6,
  },
  {
    id: 'q3-doctor',
    query: 'when is my doctor appointment?',
    now: day('2026-08-19'),
    expectNoteIds: ['n1'],
    topK: 3,
    note: 'Topical: "doctor" must match a note that only said "dr".',
  },
  {
    id: 'q4-store',
    query: 'what do I need from the store?',
    now: day('2026-08-19'),
    expectNoteIds: ['n5'],
    topK: 3,
    note: 'Topical via shared tag: "store" must reach "milk, eggs, bread".',
  },
  {
    id: 'q5-sarah',
    query: 'what did Sarah recommend I read?',
    now: day('2026-08-19'),
    expectNoteIds: ['n8'],
    topK: 3,
  },
  {
    id: 'q6-ideas',
    query: 'any app ideas?',
    now: day('2026-08-19'),
    expectNoteIds: ['n9'],
    topK: 3,
  },
  {
    id: 'q7-overdue',
    query: "what's overdue?",
    now: day('2026-08-22'),
    expectNoteIds: ['n2', 'n3', 'n4'],
    topK: 5,
  },
];
