import { toggleItem } from '../toggleItem';

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
});
