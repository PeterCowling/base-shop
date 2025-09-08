import { jest } from '@jest/globals';

const mockJson = {
  read: jest.fn(),
  write: jest.fn(),
  getById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  duplicate: jest.fn(),
};

const mockPrisma = {
  read: jest.fn(),
  write: jest.fn(),
  getById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  duplicate: jest.fn(),
};

let prismaImportCount = 0;

jest.mock('../products.json.server', () => ({
  jsonProductsRepository: mockJson,
}));

jest.mock('../products.prisma.server', () => {
  prismaImportCount++;
  return { prismaProductsRepository: mockPrisma };
});

jest.mock('../../db', () => ({ prisma: { product: {} } }));

jest.mock('../repoResolver', () => ({
  resolveRepo: async (
    prismaDelegate: any,
    prismaModule: any,
    jsonModule: any,
    options: any,
  ) => {
    const backend = process.env[options.backendEnvVar];
    if (backend === 'json') {
      return await jsonModule();
    }
    return await prismaModule();
  },
}));

describe('products repository backend selection', () => {
  const origBackend = process.env.PRODUCTS_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    prismaImportCount = 0;
    process.env.DATABASE_URL = 'postgres://test';
  });

  afterEach(() => {
    if (origBackend === undefined) {
      delete process.env.PRODUCTS_BACKEND;
    } else {
      process.env.PRODUCTS_BACKEND = origBackend;
    }
    if (origDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = origDbUrl;
    }
  });

  it('uses json repository when PRODUCTS_BACKEND="json"', async () => {
    process.env.PRODUCTS_BACKEND = 'json';
    const {
      readRepo,
      writeRepo,
      updateProductInRepo,
    } = await import('../products.server');

    await readRepo('shop');
    await writeRepo('shop', []);
    await updateProductInRepo('shop', { id: 'id', row_version: 1 });

    expect(mockJson.read).toHaveBeenCalledWith('shop');
    expect(mockJson.write).toHaveBeenCalledWith('shop', []);
    expect(mockJson.update).toHaveBeenCalledWith('shop', {
      id: 'id',
      row_version: 1,
    });
    expect(mockPrisma.read).not.toHaveBeenCalled();
  });

  it('defaults to the Prisma repository when PRODUCTS_BACKEND is not set', async () => {
    delete process.env.PRODUCTS_BACKEND;
    const {
      readRepo,
      writeRepo,
      updateProductInRepo,
    } = await import('../products.server');

    await readRepo('shop');
    await writeRepo('shop', []);
    await updateProductInRepo('shop', { id: 'id', row_version: 1 });

    expect(mockPrisma.read).toHaveBeenCalledWith('shop');
    expect(mockPrisma.write).toHaveBeenCalledWith('shop', []);
    expect(mockPrisma.update).toHaveBeenCalledWith('shop', {
      id: 'id',
      row_version: 1,
    });
    expect(mockJson.read).not.toHaveBeenCalled();
    expect(prismaImportCount).toBe(1);
  });
});
