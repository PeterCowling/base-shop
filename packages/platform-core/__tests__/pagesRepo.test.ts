import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
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

process.env.DATABASE_URL = 'postgres://localhost/test';

describe('pages repository with prisma', () => {
  it('performs CRUD operations through prisma', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pagesrepo-'));
    process.env.DATA_ROOT = path.join(dir, 'shops');
    const repo = await import('../src/repositories/pages/index.server');
    expect(await repo.getPages('shop1')).toEqual([]);
    const page = { id:'1', slug:'home', status:'draft', components:[], seo:{ title:'Home' }, createdAt:'now', updatedAt:'now', createdBy:'tester' } as any;
    await repo.savePage('shop1', page, undefined);
    expect(mockPages).toHaveLength(1);
    await repo.updatePage('shop1', { id:'1', slug:'start', updatedAt:'now' } as any, page);
    await repo.deletePage('shop1', '1');
    expect(mockPages).toHaveLength(0);
  });
});
