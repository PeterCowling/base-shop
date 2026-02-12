import { normalizeLocale } from '../normalizeLocale';

describe('normalizeLocale', () => {
  // TC-08: Supported locale tag passes through unchanged
  test('returns supported locale unchanged', () => {
    expect(normalizeLocale('it')).toBe('it');
    expect(normalizeLocale('en')).toBe('en');
  });

  // TC-09: Unsupported locale falls back to 'en'
  test('returns "en" for unsupported locale', () => {
    expect(normalizeLocale('de')).toBe('en');
    expect(normalizeLocale('fr')).toBe('en');
    expect(normalizeLocale('ja')).toBe('en');
  });

  // TC-10: Partial locale tag (with region) normalizes to base language
  test('normalizes regional variant to base language', () => {
    expect(normalizeLocale('it-IT')).toBe('it');
    expect(normalizeLocale('en-US')).toBe('en');
    expect(normalizeLocale('en-GB')).toBe('en');
  });

  // TC-11: Null/undefined/empty falls back to 'en'
  test('returns "en" for null, undefined, or empty string', () => {
    expect(normalizeLocale(undefined)).toBe('en');
    expect(normalizeLocale(null)).toBe('en');
    expect(normalizeLocale('')).toBe('en');
  });

  // TC-12: Unsupported regional variant (no base match) falls back to 'en'
  test('returns "en" for unsupported regional variant', () => {
    expect(normalizeLocale('zh-Hans')).toBe('en');
    expect(normalizeLocale('de-AT')).toBe('en');
  });
});
