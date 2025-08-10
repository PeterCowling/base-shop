import { genSecret } from '../src/genSecret';

describe('genSecret', () => {
  it('generates secrets of correct length', () => {
    const secret = genSecret(8);
    expect(secret).toHaveLength(16);
  });
});
