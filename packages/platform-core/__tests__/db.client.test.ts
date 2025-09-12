import { jest } from '@jest/globals';

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

describe('loadPrismaClient', () => {
  it('returns undefined when client module is missing', async () => {
    jest.doMock('@prisma/client', () => {
      throw new Error('missing');
    }, { virtual: true });

    const { loadPrismaClient } = await import('../src/db');
    expect(loadPrismaClient()).toBeUndefined();
    // Subsequent call hits cached value
    expect(loadPrismaClient()).toBeUndefined();
  });

  it('instantiates PrismaClient when available and DATABASE_URL is set', async () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgres://db';

    const PrismaClientMock = jest.fn().mockImplementation((opts) => ({ opts }));
    jest.doMock('@prisma/client', () => ({ PrismaClient: PrismaClientMock }), {
      virtual: true,
    });

    const { prisma } = await import('../src/db');
    expect(prisma.opts).toEqual({
      datasources: { db: { url: 'postgres://db' } },
    });
    expect(PrismaClientMock).toHaveBeenCalledWith({
      datasources: { db: { url: 'postgres://db' } },
    });
  });
});
