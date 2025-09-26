import {
  nowIso,
  isoDateInNDays,
  calculateRentalDays,
  formatTimestamp,
  parseTargetDate,
  getTimeRemaining,
  formatDuration,
  DAY_MS,
} from '@acme/date-utils';

describe('nowIso', () => {
  it('returns a valid ISO string', () => {
    const iso = nowIso();
    expect(new Date(iso).toISOString()).toBe(iso);
  });
  it('uses mocked Date.now', () => {
    const fixed = new Date('2025-02-02T03:04:05Z');
    jest.useFakeTimers().setSystemTime(fixed);
    expect(nowIso()).toBe(fixed.toISOString());
    jest.useRealTimers();
  });
});

describe('isoDateInNDays', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-01T00:00:00Z'));
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  it('returns today when 0 days are added', () => {
    const iso = isoDateInNDays(0);
    expect(iso).toBe('2025-01-01');
    const diff = (new Date(iso + 'T00:00:00Z').getTime() - Date.now()) / DAY_MS;
    expect(diff).toBe(0);
  });
  it('returns next day when 1 day is added', () => {
    const iso = isoDateInNDays(1);
    expect(iso).toBe('2025-01-02');
    const diff = (new Date(iso + 'T00:00:00Z').getTime() - Date.now()) / DAY_MS;
    expect(diff).toBe(1);
  });
  it('returns previous day when -1 day is added', () => {
    const iso = isoDateInNDays(-1);
    expect(iso).toBe('2024-12-31');
    const diff = (new Date(iso + 'T00:00:00Z').getTime() - Date.now()) / DAY_MS;
    expect(diff).toBe(-1);
  });
});

describe('calculateRentalDays', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-01T00:00:00Z'));
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  it('defaults to 1 when return date missing', () => {
    expect(calculateRentalDays()).toBe(1);
  });
  it('computes days for future return dates', () => {
    expect(calculateRentalDays('2025-01-03')).toBe(2);
  });
  it('throws for past return dates', () => {
    expect(() => calculateRentalDays('2024-12-31')).toThrow(
      'returnDate must be in the future',
    );
  });
  it('returns 1 for same-day rentals', () => {
    expect(calculateRentalDays('2025-01-01')).toBe(1);
  });
  it('throws on invalid date strings', () => {
    expect(() => calculateRentalDays('invalid')).toThrow('Invalid returnDate');
  });
});

describe('formatTimestamp', () => {
  it('formats valid ISO timestamp', () => {
    const ts = '2025-01-01T05:06:07Z';
    expect(formatTimestamp(ts)).toBe(new Date(ts).toLocaleString());
  });
  it('formats ISO timestamp for a locale', () => {
    const ts = '2025-01-01T05:06:07Z';
    const expected = new Date(ts).toLocaleString('de-DE');
    expect(formatTimestamp(ts, 'de-DE')).toBe(expected);
  });
  it('returns original string for invalid timestamp', () => {
    const bad = 'not-a-date';
    expect(formatTimestamp(bad)).toBe(bad);
  });
  it('returns original string for invalid timestamp with locale', () => {
    const bad = 'still-not-a-date';
    expect(formatTimestamp(bad, 'en-US')).toBe(bad);
  });
});

describe('parseTargetDate', () => {
  it('returns null when target date is missing', () => {
    expect(parseTargetDate()).toBeNull();
  });
  it('appends Z when no timezone provided', () => {
    expect(parseTargetDate('2025-01-01T00:00')?.toISOString()).toBe(
      '2025-01-01T00:00:00.000Z'
    );
  });
  describe('with IANA timezone', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2025-01-01T00:00:00Z'));
    });
    afterEach(() => {
      jest.useRealTimers();
    });
    it('converts to UTC', () => {
      expect(
        parseTargetDate('2025-01-01T00:00:00', 'America/New_York')?.toISOString()
      ).toBe('2025-01-01T05:00:00.000Z');
    });
  });
  it('returns null for invalid input', () => {
    expect(parseTargetDate('invalid')).toBeNull();
  });
  describe('keyword handling', () => {
    beforeEach(() => {
      jest
        .useFakeTimers()
        .setSystemTime(new Date('2025-06-15T10:00:00Z'));
    });
    afterEach(() => {
      jest.useRealTimers();
    });
    it('returns start of day for "today"', () => {
      expect(parseTargetDate('today')?.toISOString()).toBe(
        '2025-06-15T00:00:00.000Z',
      );
    });
    it('returns start of day for "tomorrow"', () => {
      expect(parseTargetDate('tomorrow')?.toISOString()).toBe(
        '2025-06-16T00:00:00.000Z',
      );
    });
  });
});

describe('getTimeRemaining', () => {
  it('calculates exact difference between dates', () => {
    const target = new Date('2025-01-02T00:00:00Z');
    const now = new Date('2025-01-01T00:00:00Z');
    expect(getTimeRemaining(target, now)).toBe(24 * 60 * 60 * 1000);
  });
  it('clamps to zero when target is in the past', () => {
    const target = new Date('2024-12-31T23:59:50Z');
    const now = new Date('2025-01-01T00:00:00Z');
    expect(getTimeRemaining(target, now)).toBe(0);
  });
  it('returns zero when target equals now', () => {
    const now = new Date('2025-01-01T00:00:00Z');
    expect(getTimeRemaining(now, now)).toBe(0);
  });
});

describe('formatDuration', () => {
  it('formats zero duration', () => {
    expect(formatDuration(0)).toBe('0s');
  });
  it('formats minutes and seconds', () => {
    expect(formatDuration(90_000)).toBe('1m 30s');
  });
  it('formats hours, minutes and seconds', () => {
    const ms = 60 * 60 * 1000 + 60 * 1000 + 1000;
    expect(formatDuration(ms)).toBe('1h 1m 1s');
  });
  it('formats days, hours, minutes and seconds', () => {
    const ms =
      24 * 60 * 60 * 1000 + 60 * 60 * 1000 + 60 * 1000 + 1000;
    expect(formatDuration(ms)).toBe('1d 1h 1m 1s');
  });
  it('clamps negative durations to 0s', () => {
    expect(formatDuration(-5000)).toBe('0s');
  });
});
