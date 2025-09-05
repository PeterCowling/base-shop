import slugify from '../slugify';

describe('slugify', () => {
  it('normalizes diacritics', () => {
    expect(slugify('Crème Brûlée')).toBe('creme-brulee');
  });

  it('removes non-word characters', () => {
    expect(slugify('foo@$%^&*bar')).toBe('foobar');
  });

  it('collapses whitespace and underscores into single hyphens', () => {
    expect(slugify('foo__ bar   baz')).toBe('foo-bar-baz');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('--foo bar--')).toBe('foo-bar');
  });

  it('outputs lowercase', () => {
    expect(slugify('Foo Bar')).toBe('foo-bar');
  });
});

