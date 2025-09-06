import { genSecret } from '../src/genSecret';

describe('genSecret', () => {
  it('defaults to a 32-character secret', () => {
    expect(genSecret()).toHaveLength(32);
  });

  it('supports custom byte length', () => {
    expect(genSecret(8)).toHaveLength(16);
  });

  it('returns only hexadecimal characters', () => {
    expect(genSecret()).toMatch(/^[0-9a-f]+$/);
  });

  it('generates a different secret each call', () => {
    const secrets = new Set([genSecret(), genSecret(), genSecret()]);
    expect(secrets.size).toBe(3);
  });
});
