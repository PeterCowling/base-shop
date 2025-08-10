import { slugify, genSecret } from '../string';

describe('string utilities', () => {
  it('slugifies strings', () => {
    expect(slugify(' Hello World! ')).toBe('hello-world');
  });

  it('generates secrets of correct length', () => {
    const secret = genSecret(8);
    expect(secret).toHaveLength(16);
  });
});
