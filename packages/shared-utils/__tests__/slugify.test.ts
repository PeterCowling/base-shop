import { slugify } from '../src/slugify';

describe('slugify', () => {
  it('converts strings to URL-friendly slugs', () => {
    expect(slugify(' Hello World! ')).toBe('hello-world');
  });
});
