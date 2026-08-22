/**
 * Shared classification vocabulary used by both the heuristic provider (to tag
 * notes) and search (to tag the query). Because a query and a note are labelled
 * from the same topic vocabulary, a query like "what do I need from the store"
 * can match a note about "milk, eggs, bread" through the shared `shopping` tag —
 * even when the raw words don't overlap. A real embedding model narrows the gap
 * further; this keeps topical matching working without one.
 */

import type { NoteKind, Priority } from '@/brain/types';

interface Rule<T> {
  value: T;
  pattern: RegExp;
}

// Order matters: earlier rules win for kind.
const KIND_RULES: Rule<NoteKind>[] = [
  {
    value: 'appointment',
    pattern:
      /\b(appointment|appt|dr|doctor|dentist|meeting|interview|call with|coming (at|on|over)|\d{1,2}\s*(am|pm))\b/,
  },
  {
    value: 'shopping',
    pattern: /\b(buy|pick up|grab|groceries|milk|eggs|bread|store|shop|order)\b/,
  },
  { value: 'idea', pattern: /\b(idea|what if|feature|brainstorm)\b/ },
  { value: 'fact', pattern: /\b(recommended|said|told me|password|birthday is|lives at)\b/ },
  {
    value: 'task',
    pattern: /\b(need to|have to|finish|submit|send|pay|renew|todo|remember to|take out|call)\b/,
  },
];

const TOPIC_RULES: Rule<string>[] = [
  {
    value: 'health',
    pattern: /\b(dr|doctor|dentist|appointment|medic|prescription|therapy|gym)\b/,
  },
  { value: 'work', pattern: /\b(work|report|meeting|boss|client|project|deadline|q[1-4])\b/ },
  { value: 'home', pattern: /\b(laundry|dishes|clean|recycling|trash|plumber|repair|house)\b/ },
  { value: 'finance', pattern: /\b(pay|bill|tax|rent|invoice|bank|money|budget)\b/ },
  { value: 'shopping', pattern: /\b(buy|groceries|milk|eggs|bread|store|shop|pick up)\b/ },
  { value: 'social', pattern: /\b(birthday|dinner|party|friend|mom|dad)\b/ },
];

const HIGH_PRIORITY = /\b(important|urgent|asap|critical|must|before|deadline|due)\b/;
const LOW_PRIORITY = /\b(someday|eventually|maybe|whenever|no rush)\b/;

export function classifyKind(text: string): NoteKind {
  const lower = text.toLowerCase();
  for (const rule of KIND_RULES) {
    if (rule.pattern.test(lower)) return rule.value;
  }
  return 'note';
}

export function classifyTopics(text: string): string[] {
  const lower = text.toLowerCase();
  return TOPIC_RULES.filter((r) => r.pattern.test(lower)).map((r) => r.value);
}

export function classifyPriority(text: string): Priority {
  const lower = text.toLowerCase();
  if (HIGH_PRIORITY.test(lower)) return 'high';
  if (LOW_PRIORITY.test(lower)) return 'low';
  return 'normal';
}
