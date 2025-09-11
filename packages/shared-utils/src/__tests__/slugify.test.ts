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

  it('trims leading/trailing punctuation and handles null/undefined', () => {
    expect(slugify('---Hello---')).toBe('hello');
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
  });
});

