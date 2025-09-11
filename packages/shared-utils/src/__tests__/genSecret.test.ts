import { genSecret } from '../genSecret';

describe('genSecret', () => {
  const originalCrypto = globalThis.crypto;
  const originalEnv = process.env.GEN_SECRET;

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', { value: originalCrypto });
    if (originalEnv === undefined) {
      delete process.env.GEN_SECRET;
    } else {
      process.env.GEN_SECRET = originalEnv;
    }
  });

  it('returns deterministic hex string for mocked bytes', () => {
    const mock = {
      getRandomValues: (arr: Uint8Array) => {
        arr.set([0xde, 0xad, 0xbe, 0xef]);
        return arr;
      },
    } as Crypto;
    Object.defineProperty(globalThis, 'crypto', { value: mock });
    expect(genSecret(4)).toBe('deadbeef');
  });

  it('uses 16 bytes by default', () => {
    const getRandomValues = jest.fn((arr: Uint8Array) => {
      arr.fill(0);
      return arr;
    });
    const mock = { getRandomValues } as Crypto;
    Object.defineProperty(globalThis, 'crypto', { value: mock });
    expect(genSecret()).toBe('00'.repeat(16));
    expect(getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
  });

  it('returns expected length and hex characters', () => {
    const mock = {
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = i;
        }
        return arr;
      },
    } as Crypto;
    Object.defineProperty(globalThis, 'crypto', { value: mock });
    const bytes = 8;
    const secret = genSecret(bytes);
    expect(secret).toHaveLength(bytes * 2);
    expect(secret).toMatch(/^[0-9a-f]+$/);
  });

  it('throws when byte length is negative', () => {
    expect(() => genSecret(-1)).toThrow(RangeError);
  });

  it('uses GEN_SECRET env var when provided', () => {
    const getRandomValues = jest.fn();
    const mock = { getRandomValues } as Crypto;
    Object.defineProperty(globalThis, 'crypto', { value: mock });
    process.env.GEN_SECRET = 'fixed';
    expect(genSecret()).toBe('fixed');
    expect(getRandomValues).not.toHaveBeenCalled();
  });

  it('throws when crypto is unavailable', () => {
    Object.defineProperty(globalThis, 'crypto', { value: undefined });
    expect(() => genSecret()).toThrow('crypto.getRandomValues is not available');
  });
});
