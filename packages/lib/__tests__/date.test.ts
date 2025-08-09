import { parseIsoDate, calculateRentalDays, isoDateInNDays } from '../src/date';

describe('parseIsoDate', () => {
  test('parses valid YYYY-MM-DD string', () => {
    const d = parseIsoDate('2025-01-02');
    expect(d).toBeInstanceOf(Date);
    expect(d?.toISOString().slice(0, 10)).toBe('2025-01-02');
  });

  test('returns null for invalid input', () => {
    expect(parseIsoDate('not-a-date')).toBeNull();
    expect(parseIsoDate('2025-99-99')).toBeNull();
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
