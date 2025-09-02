import { toggleItem } from './toggleItem';

describe('toggleItem', () => {
  it('adds item when missing', () => {
    expect(toggleItem([1, 2], 3)).toEqual([1, 2, 3]);
  });

  it('removes item when present', () => {
    expect(toggleItem([1, 2, 3], 2)).toEqual([1, 3]);
  });
});

