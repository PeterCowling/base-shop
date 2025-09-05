import { genSecret } from './genSecret';

describe('genSecret', () => {
  const original = globalThis.crypto;

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', { value: original });
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
    const mock = {
      getRandomValues: (arr: Uint8Array) => {
        arr.fill(0);
        return arr;
      },
    } as Crypto;
    Object.defineProperty(globalThis, 'crypto', { value: mock });
    expect(genSecret()).toBe('00'.repeat(16));
  });

  it('throws when byte length is negative', () => {
    expect(() => genSecret(-1)).toThrow(RangeError);
  });
});
