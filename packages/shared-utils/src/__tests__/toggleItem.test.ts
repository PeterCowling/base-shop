import { toggleItem } from '../toggleItem';

describe('toggleItem', () => {
  it('adds item when missing without mutating the original array', () => {
    const input = [1, 2];
    const result = toggleItem(input, 3);

    expect(result).toEqual([1, 2, 3]);
    expect(result).not.toBe(input);
    expect(input).toEqual([1, 2]);
  });

  it('removes an existing item without duplicating', () => {
    const input = [1, 2, 3];
    const result = toggleItem(input, 2);

    expect(result).toEqual([1, 3]);
    expect(result).not.toEqual([1, 2, 3, 2]);
    expect(result).not.toBe(input);
    expect(input).toEqual([1, 2, 3]);
  });

  it('removing a value eliminates all duplicates', () => {
    const input = [1, 2, 2, 3];
    const result = toggleItem(input, 2);

    expect(result).toEqual([1, 3]);
    expect(result).not.toBe(input);
    expect(input).toEqual([1, 2, 2, 3]);
  });

  it('adds item to empty list', () => {
    const input: string[] = [];
    const result = toggleItem(input, 'x');

    expect(result).toEqual(['x']);
    expect(result).not.toBe(input);
    expect(input).toEqual([]);
  });

  it('does not mutate the original list', () => {
    const input = [1, 2, 3];
    const added = toggleItem(input, 4);
    const removed = toggleItem(input, 2);

    expect(input).toEqual([1, 2, 3]);
    expect(added).not.toBe(input);
    expect(removed).not.toBe(input);
  });
});

