import { jest } from '@jest/globals';

const mockPages: any[] = [];

jest.mock('../src/db', () => ({
  prisma: {
    page: {
      findMany: jest.fn(async ({ where }: any) => mockPages.filter(p => p.shopId === where.shopId)),
      upsert: jest.fn(async ({ create }: any) => { mockPages.push(create); return create; }),
      deleteMany: jest.fn(async ({ where }: any) => { const idx = mockPages.findIndex(p => p.id === where.id); if (idx === -1) return { count: 0 }; mockPages.splice(idx,1); return { count:1 }; }),
      findUnique: jest.fn(async ({ where }: any) => mockPages.find(p => p.id === where.id) || null),
      update: jest.fn(async ({ where, data }: any) => { const idx = mockPages.findIndex(p => p.id === where.id); mockPages[idx] = { ...mockPages[idx], ...data }; return mockPages[idx]; }),
    }
  }
}));

describe('pages repository with prisma', () => {
  it('performs CRUD operations through prisma', async () => {
    const repo = await import('../src/repositories/pages/index.server');
    expect(await repo.getPages('shop1')).toEqual([]);
    const page = { id:'1', slug:'home', status:'draft', components:[], seo:{ title:'Home' }, createdAt:'now', updatedAt:'now', createdBy:'tester' } as any;
    await repo.savePage('shop1', page);
    expect(mockPages).toHaveLength(1);
    await repo.updatePage('shop1', { id:'1', slug:'start', updatedAt:'now' } as any);
    await repo.deletePage('shop1', '1');
    expect(mockPages).toHaveLength(0);
  });
});
