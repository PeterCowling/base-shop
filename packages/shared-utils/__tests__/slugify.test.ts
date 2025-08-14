import slugify from '../src/slugify';

describe('slugify', () => {
  it('converts strings to URL-friendly slugs', () => {
    expect(slugify(' Hello World! ')).toBe('hello-world');
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
});
