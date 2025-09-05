import { genSecret } from '@acme/shared-utils/src/genSecret';

describe('genSecret', () => {
  it('returns expected hex string for mocked random values', () => {
    const spy = jest
      .spyOn(globalThis.crypto, 'getRandomValues')
      .mockImplementation((array: Uint8Array) => {
        array.set([0xde, 0xad, 0xbe, 0xef]);
        return array;
      });

    const secret = genSecret(4);
    expect(secret).toBe('deadbeef');
    expect(secret).toHaveLength(8);

    spy.mockRestore();
  });
});
