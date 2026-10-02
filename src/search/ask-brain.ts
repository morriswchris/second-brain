// React Native's built-in URL lacks setters the SDK uses when building request
// URLs (e.g. `url.search = ...`); this installs a spec-compliant URL on
// iOS/Android and is a no-op on web.
import 'react-native-url-polyfill/auto';

import Anthropic from '@anthropic-ai/sdk';

import { formatDayLabel } from '@/notes/note-utils';
import type { Note } from '@/notes/types';

/**
 * "Ask your brain": answer a natural-language question over the user's notes
 * with Claude, returning the answer plus the ids of the notes it drew on.
 *
 * The whole note set goes in one request. A personal brain dump is small
 * (thousands of short notes still fit comfortably in context), so there is no
 * retrieval/embedding layer to keep in sync — Claude reads everything and
 * cites what it used.
 */

export const ASK_MODEL = 'claude-opus-5-5';

export type BrainAnswer = {
  answer: string;
  /** Ids of the notes the answer is based on, in the order Claude cited them. */
  noteIds: string[];
};

export type AskBrainErrorKind =
  'auth' | 'rate_limit' | 'network' | 'refusal' | 'bad_response' | 'api';

export class AskBrainError extends Error {
  constructor(
    readonly kind: AskBrainErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'AskBrainError';
  }
}

const SYSTEM_PROMPT = `You answer questions about the user's personal notes: quick thoughts, tasks, ideas and reminders they captured in a "second brain" app.

Answer only from the notes provided. If the notes don't contain the answer, say so plainly in one sentence rather than guessing.

Write for a phone screen: lead with the direct answer, keep it to a few short sentences or a short list, and use plain text without markdown headings or bold. Refer to notes by their content, never by id.

Notes carry the local time they were captured. Use that and the current time to interpret relative questions such as "today", "this week" or "yesterday", and when ordering by priority, weigh urgency and deadlines mentioned in the notes.

In note_ids, list the ids of the notes your answer relies on, most relevant first. Leave it empty if no note is relevant.`;

/** JSON schema for the structured response (`output_config.format`). */
export const ANSWER_SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    note_ids: { type: 'array', items: { type: 'string' } },
  },
  required: ['answer', 'note_ids'],
  additionalProperties: false,
} as const;

function formatClock(time: number): string {
  return new Date(time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** The current moment, spelled out so relative questions resolve correctly. */
export function describeNow(now: number): string {
  const date = new Date(now).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return `${date}, ${formatClock(now)}`;
}

/** Render notes (newest first) as one line each: id, when, text. */
export function formatNotesForPrompt(notes: Note[], now: number): string {
  return notes
    .map((note) => {
      const day = formatDayLabel(note.createdAt, now);
      const text = note.text.replace(/\s*\n\s*/g, ' / ');
      return `[${note.id}] ${day}, ${formatClock(note.createdAt)}: ${text}`;
    })
    .join('\n');
}

export function buildUserMessage(question: string, notes: Note[], now: number): string {
  return [
    `Current local time: ${describeNow(now)}`,
    '',
    `<notes count="${notes.length}">`,
    formatNotesForPrompt(notes, now),
    '</notes>',
    '',
    `Question: ${question.trim()}`,
  ].join('\n');
}

/**
 * Parse and sanity-check the model's JSON. Unknown ids are dropped (and
 * duplicates collapsed) so the UI only ever links to notes that exist.
 */
export function parseBrainAnswer(text: string, knownIds: ReadonlySet<string>): BrainAnswer {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new AskBrainError('bad_response', 'Claude returned an answer the app could not read.');
  }

  const record = data as { answer?: unknown; note_ids?: unknown };
  if (typeof record?.answer !== 'string' || !Array.isArray(record.note_ids)) {
    throw new AskBrainError('bad_response', 'Claude returned an answer the app could not read.');
  }

  const noteIds = [
    ...new Set(
      record.note_ids.filter((id): id is string => typeof id === 'string' && knownIds.has(id)),
    ),
  ];
  return { answer: record.answer.trim(), noteIds };
}

/** Map SDK failures to messages a person can act on. */
export function toAskBrainError(error: unknown): AskBrainError {
  if (error instanceof AskBrainError) return error;
  if (error instanceof Anthropic.AuthenticationError) {
    return new AskBrainError(
      'auth',
      'Anthropic rejected this API key. Check it and save it again.',
    );
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return new AskBrainError(
      'auth',
      'This API key can’t use the model. Check the key’s workspace and permissions in the Anthropic Console.',
    );
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new AskBrainError(
      'rate_limit',
      'Too many requests right now. Wait a moment and try again.',
    );
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new AskBrainError(
      'network',
      'Couldn’t reach Anthropic. Search needs an internet connection.',
    );
  }
  if (error instanceof Anthropic.APIError) {
    return new AskBrainError(
      'api',
      `Anthropic returned an error${error.status ? ` (${error.status})` : ''}. Try again shortly.`,
    );
  }
  return new AskBrainError('api', 'Something went wrong while asking Claude. Try again.');
}

type AskBrainOptions = {
  apiKey: string;
  question: string;
  /** Notes to search, newest first. */
  notes: Note[];
  now?: number;
  /** Injectable for tests. */
  client?: Pick<Anthropic, 'beta'>;
  signal?: AbortSignal;
};

export async function askBrain({
  apiKey,
  question,
  notes,
  now = Date.now(),
  client,
  signal,
}: AskBrainOptions): Promise<BrainAnswer> {
  const anthropic =
    client ??
    new Anthropic({
      apiKey,
      // The key is the user's own and lives only on their device; this flag
      // lets the SDK run in the web build, where it otherwise refuses.
      dangerouslyAllowBrowser: true,
      maxRetries: 1,
    });

  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await anthropic.beta.messages.create(
      {
        model: ASK_MODEL,
        max_tokens: 8000,
        // Retrieval over a short list doesn't need deep reasoning; low effort
        // keeps answers fast.
        output_config: {
          effort: 'low',
          format: { type: 'json_schema', schema: ANSWER_SCHEMA },
        },
        // If a safety classifier declines, re-run on Anthropic's recommended
        // fallback model instead of failing the search.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserMessage(question, notes, now) }],
      },
      { signal },
    );
  } catch (error) {
    throw toAskBrainError(error);
  }

  if (response.stop_reason === 'refusal') {
    throw new AskBrainError('refusal', 'Claude declined to answer that question.');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new AskBrainError('bad_response', 'The answer was cut off. Try a narrower question.');
  }

  const text = response.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  return parseBrainAnswer(text, new Set(notes.map((note) => note.id)));
}
