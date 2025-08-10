import { jest } from '@jest/globals';

const prismaMock = {
  shop: { create: jest.fn(async () => ({})) },
  page: { createMany: jest.fn(async () => ({})) }
};

jest.mock('../src/db', () => ({ prisma: prismaMock }));
jest.mock('../src/createShop/themeUtils', () => ({ loadTokens: () => ({}) }));

describe('createShop', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates records in the database', async () => {
    const { createShop } = await import('../src/createShop');
    await createShop('shop1', { theme: 'base' }, { deploy: false });
    expect(prismaMock.shop.create).toHaveBeenCalled();
  });

  it('stores navigation structure', async () => {
    const { createShop } = await import('../src/createShop');
    await createShop('shop2', {
      theme: 'base',
      navItems: [{ label: 'Parent', url: '/parent', children: [{ label: 'Child', url: '/child' }] }]
    }, { deploy: false });
    const nav = prismaMock.shop.create.mock.calls[0][0].data.data.navigation;
    expect(nav).toEqual([
      { label: 'Parent', url: '/parent', children: [{ label: 'Child', url: '/child' }] }
    ]);
  });
});
