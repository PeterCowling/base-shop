import { jest } from '@jest/globals';

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
  process.env.SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID ?? 'project';
  process.env.SANITY_DATASET = process.env.SANITY_DATASET ?? 'dataset';
  process.env.SANITY_API_TOKEN = process.env.SANITY_API_TOKEN ?? 'token';
  process.env.SANITY_PREVIEW_SECRET =
    process.env.SANITY_PREVIEW_SECRET ?? 'preview-secret';
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

  it('caches the Prisma constructor after first load', async () => {
    const PrismaClientMock = jest.fn();
    jest.doMock('@prisma/client', () => ({ PrismaClient: PrismaClientMock }), {
      virtual: true,
    });

    const { loadPrismaClient } = await import('../src/db');
    const first = loadPrismaClient();
    const second = loadPrismaClient();
    expect(first).toBe(PrismaClientMock);
    expect(second).toBe(PrismaClientMock);
  });

  it('falls back to stub when PrismaClient is missing in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgres://db';
    jest.doMock(
      '@prisma/client',
      () => {
        throw new Error('missing');
      },
      { virtual: true },
    );

    const { prisma } = await import('../src/db');
    await expect(prisma.$transaction((tx: unknown) => tx)).resolves.toHaveProperty(
      'rentalOrder',
    );
  });
});
