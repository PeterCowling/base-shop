import { toggleItem } from '../src/toggleItem';

describe('toggleItem', () => {
  it('adds and removes values from an array', () => {
    let items: string[] = [];
    items = toggleItem(items, 'a');
    expect(items).toEqual(['a']);
    items = toggleItem(items, 'a');
    expect(items).toEqual([]);
    items = toggleItem(items, 'b');
    expect(items).toEqual(['b']);
  });

  it("doesn't mutate the original array", () => {
    const original = ['a'];
    const withAdded = toggleItem(original, 'b');

    expect(original).toEqual(['a']);
    expect(withAdded).toEqual(['a', 'b']);
    expect(withAdded).not.toBe(original);

    const withRemoved = toggleItem(original, 'a');
    expect(original).toEqual(['a']);
    expect(withRemoved).toEqual([]);
    expect(withRemoved).not.toBe(original);
  });

  it('compares objects using reference identity', () => {
    const item = { id: 1 };
    const other = { id: 1 };

    let items: { id: number }[] = [];
    items = toggleItem(items, item);
    expect(items).toEqual([item]);

    items = toggleItem(items, other);
    expect(items).toEqual([item, other]);

    items = toggleItem(items, item);
    expect(items).toEqual([other]);

    items = toggleItem(items, other);
    expect(items).toEqual([]);
  });
});
