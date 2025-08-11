import { genSecret } from '../src/genSecret';

describe('genSecret', () => {
  it('generates secrets of correct length', () => {
    const secret = genSecret(8);
    expect(secret).toHaveLength(16);
  });

  it('defaults to 32 characters when no argument is provided', () => {
    const secret = genSecret();
    expect(secret).toHaveLength(32);
  });

  it('returns a hexadecimal string', () => {
    const secret = genSecret(8);
    expect(secret).toMatch(/^[0-9a-f]+$/);
  });
});
