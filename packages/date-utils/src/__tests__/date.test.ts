import {
  parseISO,
  format,
  addDays,
  calculateRentalDays,
  isoDateInNDays,
  formatTimestamp,
  nowIso,
} from '../index';

describe('nowIso', () => {
  test('returns a valid ISO 8601 string near current time', () => {
    const isoString = nowIso();

    expect(new Date(isoString).toISOString()).toBe(isoString);

    const timestamp = Date.parse(isoString);
    expect(Math.abs(Date.now() - timestamp)).toBeLessThanOrEqual(1000);
  });
});

describe('parseISO', () => {
  test('parses valid YYYY-MM-DD string', () => {
    const d = parseISO('2025-01-02');
    expect(d).toBeInstanceOf(Date);
    expect(format(d, 'yyyy-MM-dd')).toBe('2025-01-02');
  });

  test('returns Invalid Date for invalid input', () => {
    expect(Number.isNaN(parseISO('2025-99-99').getTime())).toBe(true);
  });
});

describe('exported helpers', () => {
  test('addDays and format combine', () => {
    const d = addDays(parseISO('2025-01-01'), 1);
    expect(format(d, 'yyyy-MM-dd')).toBe('2025-01-02');
  });
});

describe('calculateRentalDays', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('computes positive day difference', () => {
    expect(calculateRentalDays('2025-01-03')).toBe(2);
  });

  test('floors past dates to one day', () => {
    expect(calculateRentalDays('2024-12-31')).toBe(1);
  });

  test('throws on invalid date', () => {
    expect(() => calculateRentalDays('invalid')).toThrow();
  });
});

describe('isoDateInNDays', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns ISO date string N days ahead', () => {
    expect(isoDateInNDays(7)).toBe('2025-01-08');
  });
});

describe('formatTimestamp', () => {
  test('formats ISO timestamp', () => {
    const ts = '2025-01-01T05:06:07Z';
    const formatted = formatTimestamp(ts, 'en-US');
    expect(formatted).toContain('2025');
    expect(formatted).not.toBe(ts);
  });

  test('returns input for invalid timestamp', () => {
    expect(formatTimestamp('nope')).toBe('nope');
  });
});
