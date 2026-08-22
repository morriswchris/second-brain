import {
  isWithinWindow,
  parseDateWindow,
  resolveRecurrence,
  resolveRelativeDate,
} from '@/brain/dates';

// Wed 2026-08-19, 12:00 UTC.
const NOW = Date.parse('2026-08-19T12:00:00Z');

describe('resolveRelativeDate', () => {
  it('resolves simple offsets against the anchor', () => {
    expect(resolveRelativeDate('due today', NOW)).toBe('2026-08-19');
    expect(resolveRelativeDate('do it tomorrow', NOW)).toBe('2026-08-20');
    expect(resolveRelativeDate('was yesterday', NOW)).toBe('2026-08-18');
    expect(resolveRelativeDate('dentist in 3 days', NOW)).toBe('2026-08-22');
  });

  it('resolves the headline case: "next Monday" to the following week', () => {
    // From a Wednesday, the coming Monday is the 24th; "next" means the 31st.
    expect(resolveRelativeDate('next Monday I have a dr appointment', NOW)).toBe('2026-08-31');
  });

  it('treats a bare weekday as the coming occurrence', () => {
    expect(resolveRelativeDate('plumber coming Thursday at 2pm', NOW)).toBe('2026-08-20');
  });

  it('passes through an explicit ISO date', () => {
    expect(resolveRelativeDate('meeting on 2026-12-01', NOW)).toBe('2026-12-01');
  });

  it('returns null when there is no temporal anchor', () => {
    expect(resolveRelativeDate('buy milk, eggs, bread', NOW)).toBeNull();
  });
});

describe('resolveRecurrence', () => {
  it('captures a recurrence phrase', () => {
    expect(resolveRecurrence('take out recycling every other Tuesday')).toBe('every other tuesday');
    expect(resolveRecurrence('water plants every day')).toBe('every day');
  });

  it('returns null without recurrence', () => {
    expect(resolveRecurrence('call the dentist')).toBeNull();
  });
});

describe('parseDateWindow', () => {
  it('parses today / tomorrow / this week / next week / overdue', () => {
    expect(parseDateWindow('what do I have today?', NOW)).toMatchObject({
      fromIso: '2026-08-19',
      toIso: '2026-08-19',
      label: 'today',
    });
    expect(parseDateWindow('anything tomorrow?', NOW)?.toIso).toBe('2026-08-20');
    expect(parseDateWindow("what's on this week?", NOW)).toMatchObject({
      fromIso: '2026-08-19',
      toIso: '2026-08-26',
    });
    expect(parseDateWindow('next week plans', NOW)).toMatchObject({
      fromIso: '2026-08-26',
      toIso: '2026-09-02',
    });
    expect(parseDateWindow("what's overdue?", NOW)).toMatchObject({
      fromIso: null,
      toIso: '2026-08-18',
    });
  });

  it('returns null for a purely topical query', () => {
    expect(parseDateWindow('what did Sarah recommend?', NOW)).toBeNull();
  });
});

describe('isWithinWindow', () => {
  const week = parseDateWindow('this week', NOW)!;
  it('includes dates inside the window and excludes those outside', () => {
    expect(isWithinWindow('2026-08-21', week)).toBe(true);
    expect(isWithinWindow('2026-08-31', week)).toBe(false);
  });
  it('never matches a null date', () => {
    expect(isWithinWindow(null, week)).toBe(false);
  });
});
