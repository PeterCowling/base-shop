import { slugify } from '@acme/lib/string';

describe('slugify', () => {
  it('lowercases and replaces spaces with dashes', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes special characters and collapses separators', () => {
    expect(slugify('  Fancy__Slug---Test!! ')).toBe('fancy-slug-test');
  });

  it('strips accents and normalizes whitespace', () => {
    expect(slugify('Crème  Brûlée')).toBe('creme-brulee');
  });
});
