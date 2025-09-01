import { mergeExternalTokens } from '../mergeExternalTokens';

describe('mergeExternalTokens', () => {
  it('overrides base tokens with external tokens', () => {
    const base = { color: 'red', size: 'medium' };
    const external = { color: 'blue' };
    const result = mergeExternalTokens(base, external);
    expect(result).toEqual({ color: 'blue', size: 'medium' });
  });

  it('keeps base tokens when external overrides are missing', () => {
    const base = { color: 'red', size: 'medium' };
    const result = mergeExternalTokens(base, {});
    expect(result).toEqual(base);
  });
});
