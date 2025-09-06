import slugify from '../src/slugify';

describe('slugify', () => {
  it('converts strings to URL-friendly slugs', () => {
    expect(slugify(' Hello World! ')).toBe('hello-world');
  });

  it('replaces underscores with hyphens and drops punctuation', () => {
    expect(slugify('Hello_World!')).toBe('hello-world');
  });

  it('handles multiple spaces and underscores', () => {
    expect(slugify('multiple   spaces__and___underscores')).toBe(
      'multiple-spaces-and-underscores',
    );
  });

  it('handles numeric-only values', () => {
    expect(slugify('12345')).toBe('12345');
  });

  it('trims leading/trailing dashes and converts to lowercase', () => {
    expect(slugify('--MiXeD-Case--')).toBe('mixed-case');
  });

  it('handles diacritics and UTF-8 characters', () => {
    expect(slugify('Crème Brûlée')).toBe('creme-brulee');
  });

  it('returns empty string for blank input', () => {
    expect(slugify('')).toBe('');
    expect(slugify('   ')).toBe('');
  });

  it('handles null and undefined inputs gracefully', () => {
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
  });

  it('lowercases, strips accents and collapses punctuation and spaces', () => {
    const input = '  Héllo,   Wörld!!  Foo__Bar ';
    expect(slugify(input)).toBe('hello-world-foo-bar');
  });
});
