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

  it('returns GEN_SECRET without using crypto', () => {
    const secret = 'predefined';
    process.env.GEN_SECRET = secret;
    const cryptoObj = globalThis.crypto!;
    const spy = jest.spyOn(cryptoObj, 'getRandomValues');

    expect(genSecret()).toBe(secret);
    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
    delete process.env.GEN_SECRET;
  });

  it('throws when crypto.getRandomValues is not available', () => {
    const originalCrypto = globalThis.crypto;
    // @ts-expect-error - removing crypto to test fallback
    delete globalThis.crypto;

    expect(() => genSecret()).toThrow('crypto.getRandomValues is not available');

    // restore crypto
    globalThis.crypto = originalCrypto;
  });
});
