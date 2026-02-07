import slugify from '../slugify';

describe('slugify', () => {
  it('converts basic ASCII strings', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('collapses multiple spaces and underscores', () => {
    expect(slugify('foo__bar   baz')).toBe('foo-bar-baz');
  });

  it('removes accents and diacritics', () => {
    expect(slugify('Crème Brûlée')).toBe('creme-brulee');
  });

  it('removes punctuation', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
  });

  it('converts underscores to hyphens and trims whitespace/dashes', () => {
    expect(slugify('  --foo_bar--  ')).toBe('foo-bar');
  });

  it('trims leading/trailing punctuation', () => {
    expect(slugify('---Hello---')).toBe('hello');
  });

  it('returns empty string when string is only punctuation', () => {
    expect(slugify('!!!')).toBe('');
  });

  it('returns an empty string for null/undefined input', () => {
    expect(slugify(null)).toBe('');
    // @ts-expect-error Test undefined input
    expect(slugify(undefined)).toBe('');
  });
});
