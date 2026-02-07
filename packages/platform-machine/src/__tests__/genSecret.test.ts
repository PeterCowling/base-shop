import { genSecret } from '@acme/lib/security';

describe('genSecret', () => {
  const original = globalThis.crypto;

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', { value: original });
  });

  it('returns a default-length hex string when crypto is stubbed', () => {
    const mock = {
      getRandomValues: (arr: Uint8Array) => {
        arr.fill(0);
        return arr;
      },
    } as Crypto;
    Object.defineProperty(globalThis, 'crypto', { value: mock });

    const secret = genSecret();
    expect(secret).toBe('00'.repeat(16));
    expect(secret).toHaveLength(32);
  });

  it('returns expected hex string for custom byte length', () => {
    const mock = {
      getRandomValues: (arr: Uint8Array) => {
        arr.set([0xde, 0xad, 0xbe, 0xef]);
        return arr;
      },
    } as Crypto;
    Object.defineProperty(globalThis, 'crypto', { value: mock });

    const secret = genSecret(4);
    expect(secret).toBe('deadbeef');
    expect(secret).toHaveLength(8);
  });
});

