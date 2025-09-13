import {
  isoDateInNDays,
  calculateRentalDays,
  formatTimestamp,
  startOfDay,
  parseDate,
  formatDate,
  parseTargetDate,
  getTimeRemaining,
  formatDuration,
} from '../index';

describe('isoDateInNDays & calculateRentalDays', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-01T00:00:00Z'));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('computes future ISO dates and rental days', () => {
    expect(isoDateInNDays(3)).toBe('2025-01-04');
    expect(calculateRentalDays('2025-01-04')).toBe(3);
  });

  it('defaults to one day or throws for past/invalid dates', () => {
    expect(calculateRentalDays()).toBe(1);
    expect(() => calculateRentalDays('2024-12-31')).toThrow('returnDate must be in the future');
    expect(() => calculateRentalDays('invalid')).toThrow();
  });
});

describe('formatTimestamp', () => {
  it('formats ISO and numeric timestamps', () => {
    const iso = '2025-01-01T05:06:07Z';
    const ms = Date.UTC(2025, 0, 1, 5, 6, 7);
    expect(formatTimestamp(iso)).not.toBe(iso);
    expect(formatTimestamp(ms.toString())).toBe(new Date(ms).toLocaleString());
  });

  it('returns input for invalid timestamps', () => {
    expect(formatTimestamp('nope')).toBe('nope');
  });
});

describe('startOfDay, parseDate and formatDate', () => {
  it('handles timezone conversions', () => {
    const start = startOfDay('2025-03-10T12:00:00Z', 'America/New_York');
    expect(start.toISOString()).toBe('2025-03-10T04:00:00.000Z');
    expect(parseDate('2025-03-03T00:00:00', 'America/New_York')?.toISOString()).toBe('2025-03-03T05:00:00.000Z');
    expect(formatDate('2025-03-03T05:06:07Z', 'HH:mm', 'America/New_York')).toBe('00:06');
  });

  it('parses and formats ISO dates', () => {
    expect(parseDate('2025-03-03T00:00:00Z')?.toISOString()).toBe('2025-03-03T00:00:00.000Z');
    expect(formatDate('2025-03-03T05:06:07Z', 'yyyy-MM-dd')).toBe('2025-03-03');
  });

  it('returns null for invalid strings', () => {
    expect(parseDate('not-a-date')).toBeNull();
  });
});

describe('parseTargetDate', () => {
  it('supports "today", "tomorrow" and "yesterday"', () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-06-15T10:00:00Z'));
    expect(parseTargetDate('today')?.toISOString()).toBe('2025-06-15T00:00:00.000Z');
    expect(parseTargetDate('tomorrow')?.toISOString()).toBe('2025-06-16T00:00:00.000Z');
    expect(parseTargetDate('yesterday')?.toISOString()).toBe('2025-06-14T00:00:00.000Z');
    jest.useRealTimers();
  });

  it('parses strings with and without zones', () => {
    expect(parseTargetDate('2025-01-01T00:00:00')?.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    expect(parseTargetDate('2025-01-01T00:00:00', 'America/New_York')?.toISOString()).toBe('2025-01-01T05:00:00.000Z');
    expect(parseTargetDate('invalid')).toBeNull();
  });
});

describe('DST boundaries', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-03-09T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('handles startOfDay and parseTargetDate across DST', () => {
    const tz = 'America/New_York';
    expect(startOfDay(new Date(), tz).toISOString()).toBe('2025-03-09T05:00:00.000Z');
    expect(parseTargetDate('tomorrow', tz)?.toISOString()).toBe('2025-03-10T04:00:00.000Z');
    expect(parseTargetDate('yesterday', tz)?.toISOString()).toBe('2025-03-08T05:00:00.000Z');
  });
});

describe('getTimeRemaining & formatDuration', () => {
  const base = new Date('2025-01-01T00:00:00Z');

  it('returns remaining ms and formats duration', () => {
    const target = new Date('2025-01-01T00:00:05Z');
    const remaining = getTimeRemaining(target, base);
    expect(remaining).toBe(5000);
    expect(formatDuration(remaining)).toBe('5s');
  });

  it('clamps past times to zero', () => {
    const target = new Date('2024-12-31T23:59:55Z');
    const remaining = getTimeRemaining(target, base);
    expect(remaining).toBe(0);
    expect(formatDuration(remaining)).toBe('0s');
  });

  it('formats human-readable durations', () => {
    const ms = (1 * 86400 + 2 * 3600 + 3 * 60 + 4) * 1000;
    expect(formatDuration(ms)).toBe('1d 2h 3m 4s');
  });
});

