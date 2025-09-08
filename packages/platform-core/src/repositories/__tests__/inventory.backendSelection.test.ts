import { jest } from '@jest/globals';

const mockSqlite = {
  read: jest.fn(),
  write: jest.fn(),
  update: jest.fn(),
};

const mockJson = {
  read: jest.fn(),
  write: jest.fn(),
  update: jest.fn(),
};

const mockPrisma = {
  read: jest.fn(),
  write: jest.fn(),
  update: jest.fn(),
};

let prismaImportCount = 0;

jest.mock(
  '../inventory.sqlite.server',
  () => ({
    sqliteInventoryRepository: mockSqlite,
  }),
  { virtual: true },
);

jest.mock('../inventory.json.server', () => ({
  jsonInventoryRepository: mockJson,
}));

jest.mock('../inventory.prisma.server', () => {
  prismaImportCount++;
  return { prismaInventoryRepository: mockPrisma };
});

jest.mock('../../db', () => ({ prisma: { inventoryItem: {} } }));

jest.mock('../repoResolver', () => ({
  resolveRepo: async (
    prismaDelegate: any,
    prismaModule: any,
    jsonModule: any,
    options: { sqliteModule: () => Promise<any> },
  ) => {
    if (process.env.INVENTORY_BACKEND === 'sqlite') {
      return await options.sqliteModule();
    }
    if (process.env.INVENTORY_BACKEND === 'json') {
      return await jsonModule();
    }
    return await prismaModule();
  },
}));

describe('inventory repository backend selection', () => {
  const origBackend = process.env.INVENTORY_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    prismaImportCount = 0;
    process.env.DATABASE_URL = 'postgres://test';
  });

  afterEach(() => {
    if (origBackend === undefined) {
      delete process.env.INVENTORY_BACKEND;
    } else {
      process.env.INVENTORY_BACKEND = origBackend;
    }
    if (origDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = origDbUrl;
    }
  });

  it('uses sqlite repository when INVENTORY_BACKEND="sqlite"', async () => {
    process.env.INVENTORY_BACKEND = 'sqlite';
    const { inventoryRepository } = await import('../inventory.server');
    const mutate = jest.fn();

    await inventoryRepository.read('shop');
    await inventoryRepository.write('shop', []);
    await inventoryRepository.update('shop', 'sku', {}, mutate);

    expect(mockSqlite.read).toHaveBeenCalledWith('shop');
    expect(mockSqlite.write).toHaveBeenCalledWith('shop', []);
    expect(mockSqlite.update).toHaveBeenCalledWith('shop', 'sku', {}, mutate);
    expect(mockJson.read).not.toHaveBeenCalled();
    expect(mockPrisma.read).not.toHaveBeenCalled();
  });

  it('uses json repository when INVENTORY_BACKEND="json"', async () => {
    process.env.INVENTORY_BACKEND = 'json';
    const { inventoryRepository } = await import('../inventory.server');
    const mutate = jest.fn();

    await inventoryRepository.read('shop');
    await inventoryRepository.write('shop', []);
    await inventoryRepository.update('shop', 'sku', {}, mutate);

    expect(mockJson.read).toHaveBeenCalledWith('shop');
    expect(mockJson.write).toHaveBeenCalledWith('shop', []);
    expect(mockJson.update).toHaveBeenCalledWith('shop', 'sku', {}, mutate);
    expect(mockSqlite.read).not.toHaveBeenCalled();
    expect(mockPrisma.read).not.toHaveBeenCalled();
  });

  it('defaults to the Prisma repository when INVENTORY_BACKEND is not set', async () => {
    delete process.env.INVENTORY_BACKEND;
    const { inventoryRepository } = await import('../inventory.server');
    const mutate = jest.fn();

    await inventoryRepository.read('shop');
    await inventoryRepository.write('shop', []);
    await inventoryRepository.update('shop', 'sku', {}, mutate);

    expect(mockPrisma.read).toHaveBeenCalledWith('shop');
    expect(mockPrisma.write).toHaveBeenCalledWith('shop', []);
    expect(mockPrisma.update).toHaveBeenCalledWith('shop', 'sku', {}, mutate);
    expect(mockJson.read).not.toHaveBeenCalled();
    expect(mockSqlite.read).not.toHaveBeenCalled();
    expect(prismaImportCount).toBe(1);
  });
});
