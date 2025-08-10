import { jest } from '@jest/globals';

const prismaMock = {
  shop: { create: jest.fn(async () => ({})) },
  page: { createMany: jest.fn(async () => ({})) }
};

jest.mock('../src/db', () => ({ prisma: prismaMock }));

describe('createShop', () => {
  it('creates records in the database', async () => {
    const { createShop } = await import('../src/createShop');
    await createShop('shop1', { theme: 'base' });
    expect(prismaMock.shop.create).toHaveBeenCalled();
    expect(prismaMock.page.createMany).toHaveBeenCalled();
  });
});
