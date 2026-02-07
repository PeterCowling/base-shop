import { toggleItem } from '@acme/lib/array';

describe('toggleItem', () => {
  it('adds an item when missing without mutating input', () => {
    const arr = [1, 2];
    const result = toggleItem(arr, 3);
    expect(result).toEqual([1, 2, 3]);
    expect(arr).toEqual([1, 2]);
  });

  it('removes item when present and leaves original intact', () => {
    const arr = [1, 2, 3];
    const result = toggleItem(arr, 2);
    expect(result).toEqual([1, 3]);
    expect(arr).toEqual([1, 2, 3]);
  });

  it('removes all duplicates of the item', () => {
    const arr = [1, 2, 2, 3];
    const result = toggleItem(arr, 2);
    expect(result).toEqual([1, 3]);
  });
});
