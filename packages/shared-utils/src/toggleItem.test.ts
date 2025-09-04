import { toggleItem } from './toggleItem';

describe('toggleItem', () => {
  it('adds item when missing', () => {
    expect(toggleItem([1, 2], 3)).toEqual([1, 2, 3]);
  });

  it('removes item when present', () => {
    expect(toggleItem([1, 2, 3], 2)).toEqual([1, 3]);
  });

  it('removes all instances when duplicates are present', () => {
    expect(toggleItem([1, 2, 2, 3], 2)).toEqual([1, 3]);
  });

  it('returns a new array without mutating the input', () => {
    const input = [1, 2, 3];
    const result = toggleItem(input, 4);

    expect(result).toEqual([1, 2, 3, 4]);
    expect(result).not.toBe(input);
    expect(input).toEqual([1, 2, 3]);
  });
});

