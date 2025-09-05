import {
  nowIso,
  isoDateInNDays,
  calculateRentalDays,
  formatTimestamp,
  parseTargetDate,
  getTimeRemaining,
  formatDuration,
} from '@acme/date-utils/src';

describe('nowIso', () => {
  it('returns a valid ISO string', () => {
    const iso = nowIso();
    expect(new Date(iso).toISOString()).toBe(iso);
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
    expect(isoDateInNDays(0)).toBe('2025-01-01');
  });
  it('returns next day when 1 day is added', () => {
    expect(isoDateInNDays(1)).toBe('2025-01-02');
  });
  it('returns previous day when -1 day is added', () => {
    expect(isoDateInNDays(-1)).toBe('2024-12-31');
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
  it('returns 1 for past return dates', () => {
    expect(calculateRentalDays('2024-12-31')).toBe(1);
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
  it('returns original string for invalid timestamp', () => {
    const bad = 'not-a-date';
    expect(formatTimestamp(bad)).toBe(bad);
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
});

describe('getTimeRemaining', () => {
  it('calculates exact difference between dates', () => {
    const target = new Date('2025-01-02T00:00:00Z');
    const now = new Date('2025-01-01T00:00:00Z');
    expect(getTimeRemaining(target, now)).toBe(24 * 60 * 60 * 1000);
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
});

