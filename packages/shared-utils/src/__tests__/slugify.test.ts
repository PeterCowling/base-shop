import slugify from '../slugify';

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('strips accents and punctuation', () => {
    expect(slugify('Café Déjà Vu!')).toBe('cafe-deja-vu');
  });

  it('removes emojis and non-Latin characters', () => {
    expect(slugify('Hello 🌍 世界')).toBe('hello');
  });

  it('handles multiple spaces', () => {
    expect(slugify('  multiple   spaces  ')).toBe('multiple-spaces');
  });

  it('collapses repeated hyphens and trims separators', () => {
    expect(slugify('--a---b--')).toBe('a-b');
  });

  it('returns empty string for empty or null input', () => {
    expect(slugify('')).toBe('');
    expect(slugify(null)).toBe('');
  });
});
