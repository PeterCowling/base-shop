import { parseIsoDate } from '../src/date';

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
