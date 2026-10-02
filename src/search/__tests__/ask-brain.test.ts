import Anthropic from '@anthropic-ai/sdk';

import type { Note } from '@/notes/types';
import {
  ASK_MODEL,
  AskBrainError,
  askBrain,
  buildUserMessage,
  parseBrainAnswer,
  toAskBrainError,
} from '@/search/ask-brain';

const now = new Date(2025, 9, 1, 12).getTime();
const notes: Note[] = [
  { id: 'n2', text: 'Call the dentist before 5pm', createdAt: new Date(2025, 9, 1, 9).getTime() },
  {
    id: 'n1',
    text: 'Idea: weekly review\non Sundays',
    createdAt: new Date(2025, 8, 30, 20).getTime(),
  },
];

function fakeClient(response: Partial<Anthropic.Beta.BetaMessage> | Error) {
  const create = jest.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  return {
    client: { beta: { messages: { create } } } as unknown as Pick<Anthropic, 'beta'>,
    create,
  };
}

function textResponse(json: unknown): Partial<Anthropic.Beta.BetaMessage> {
  return {
    stop_reason: 'end_turn',
    content: [{ type: 'text', text: JSON.stringify(json), citations: null }],
  };
}

describe('buildUserMessage', () => {
  it('includes the current time, every note with its id, and the question', () => {
    const message = buildUserMessage('  what should I do today? ', notes, now);

    expect(message).toContain('Current local time:');
    expect(message).toContain('[n2] Today');
    expect(message).toContain('Call the dentist before 5pm');
    expect(message).toContain('[n1] Yesterday');
    // Newlines inside a note are flattened so each note stays on one line.
    expect(message).toContain('Idea: weekly review / on Sundays');
    expect(message.trim().endsWith('Question: what should I do today?')).toBe(true);
  });
});

describe('parseBrainAnswer', () => {
  const known = new Set(['n1', 'n2']);

  it('keeps known ids in order and drops unknown or duplicate ones', () => {
    const result = parseBrainAnswer(
      JSON.stringify({ answer: ' Call the dentist. ', note_ids: ['n2', 'ghost', 'n2', 'n1'] }),
      known,
    );
    expect(result).toEqual({ answer: 'Call the dentist.', noteIds: ['n2', 'n1'] });
  });

  it('rejects malformed output', () => {
    expect(() => parseBrainAnswer('not json', known)).toThrow(AskBrainError);
    expect(() => parseBrainAnswer(JSON.stringify({ answer: 1 }), known)).toThrow(AskBrainError);
  });
});

describe('askBrain', () => {
  it('sends a structured-output request and returns the parsed answer', async () => {
    const { client, create } = fakeClient(
      textResponse({ answer: 'Call the dentist before 5pm.', note_ids: ['n2'] }),
    );

    const result = await askBrain({ apiKey: 'k', question: 'today?', notes, now, client });

    expect(result).toEqual({ answer: 'Call the dentist before 5pm.', noteIds: ['n2'] });
    const [params] = create.mock.calls[0] as unknown as [Anthropic.Beta.MessageCreateParams];
    expect(params.model).toBe(ASK_MODEL);
    expect(params.output_config?.format?.type).toBe('json_schema');
    expect(params.fallbacks).toBe('default');
  });

  it('reports a refusal instead of parsing it', async () => {
    const { client } = fakeClient({ stop_reason: 'refusal', content: [] });

    await expect(
      askBrain({ apiKey: 'k', question: 'q', notes, now, client }),
    ).rejects.toMatchObject({
      kind: 'refusal',
    });
  });

  it('maps an invalid key to an auth error', async () => {
    const { client } = fakeClient(
      new Anthropic.AuthenticationError(401, undefined, 'invalid x-api-key', new Headers()),
    );

    await expect(
      askBrain({ apiKey: 'bad', question: 'q', notes, now, client }),
    ).rejects.toMatchObject({ kind: 'auth' });
  });
});

describe('toAskBrainError', () => {
  it('classifies connection failures as network errors', () => {
    expect(toAskBrainError(new Anthropic.APIConnectionError({ message: 'offline' })).kind).toBe(
      'network',
    );
  });
});
