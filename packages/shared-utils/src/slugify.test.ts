import slugify from './slugify';

describe('slugify', () => {
  it('creates slugs from plain text', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('handles accents and punctuation', () => {
    expect(slugify('Crème_brûlée!')).toBe('creme-brulee');
  });
});

