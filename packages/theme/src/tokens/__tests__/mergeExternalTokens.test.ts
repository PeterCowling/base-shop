import { mergeExternalTokens } from '../mergeExternalTokens';

describe('mergeExternalTokens', () => {
  it('overrides base tokens with external tokens', () => {
    const base = { color: 'red', size: 'medium' };
    const external = { color: 'blue' };
    const result = mergeExternalTokens(base, external);
    expect(result).toEqual({ color: 'blue', size: 'medium' });
  });

  it('includes new tokens from external object', () => {
    const base = { color: 'red' };
    const external = { color: 'blue', weight: 'bold' };
    const result = mergeExternalTokens(base, external);
    expect(result).toEqual({ color: 'blue', weight: 'bold' });
  });

  it('keeps base tokens when external overrides are missing', () => {
    const base = { color: 'red', size: 'medium' };
    const result = mergeExternalTokens(base, {});
    expect(result).toEqual(base);
  });

  it('merges tokens when base is empty', () => {
    const external = { color: 'blue' };
    const result = mergeExternalTokens({}, external);
    expect(result).toEqual(external);
  });

  it('returns empty object when both inputs are empty', () => {
    const result = mergeExternalTokens({}, {});
    expect(result).toEqual({});
  });

  it('does not mutate the original objects', () => {
    const base = { color: 'red' };
    const external = { color: 'blue' };
    const baseCopy = { ...base };
    const externalCopy = { ...external };
    mergeExternalTokens(base, external);
    expect(base).toEqual(baseCopy);
    expect(external).toEqual(externalCopy);
  });
});
