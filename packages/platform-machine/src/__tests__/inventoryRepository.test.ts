import { jest } from '@jest/globals';

let jsonImportCount = 0;
let sqliteImportCount = 0;
let prismaImportCount = 0;

const jsonRepo = {
  read: jest.fn(),
  write: jest.fn(),
  update: jest.fn(),
};
const sqliteRepo = {
  read: jest.fn(),
  write: jest.fn(),
  update: jest.fn(),
};
const prismaRepo = {
  read: jest.fn(),
  write: jest.fn(),
  update: jest.fn(),
};

jest.mock('@acme/platform-core/repositories/inventory.json.server', () => {
  jsonImportCount++;
  return { jsonInventoryRepository: jsonRepo };
});

jest.mock(
  '../../platform-core/src/repositories/inventory.sqlite.server',
  () => {
    sqliteImportCount++;
    return { sqliteInventoryRepository: sqliteRepo };
  },
  { virtual: true },
);

jest.mock('@acme/platform-core/repositories/inventory.prisma.server', () => {
  prismaImportCount++;
  return { prismaInventoryRepository: prismaRepo };
});

jest.mock('@acme/platform-core/db', () => ({ prisma: { inventoryItem: {} } }));

jest.mock('@acme/platform-core/repositories/repoResolver', () => ({
  resolveRepo: async (
    prismaDelegate: any,
    prismaModule: any,
    jsonModule: any,
  ) => {
    if (process.env.INVENTORY_BACKEND === 'sqlite') {
      const mod = await import('../../platform-core/src/repositories/inventory.sqlite.server');
      return mod.sqliteInventoryRepository;
    }
    if (process.env.INVENTORY_BACKEND === 'json') {
      return await jsonModule();
    }
    return await prismaModule();
  },
}));

describe('inventory repository', () => {
  const origBackend = process.env.INVENTORY_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jsonImportCount = 0;
    sqliteImportCount = 0;
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

  it('getRepo defaults to the prisma backend and caches the promise', async () => {
    const mod1 = await import('@acme/platform-core/repositories/inventory.server');
    await mod1.inventoryRepository.read('s1');
    const mod2 = await import('@acme/platform-core/repositories/inventory.server');
    await mod2.inventoryRepository.read('s2');

    expect(prismaImportCount).toBe(1);
    expect(jsonImportCount).toBe(0);
    expect(sqliteImportCount).toBe(0);
    expect(mod1.inventoryRepository).toBe(mod2.inventoryRepository);
    expect(prismaRepo.read).toHaveBeenCalledTimes(2);
  });

  it('getRepo uses json backend when configured', async () => {
    process.env.INVENTORY_BACKEND = 'json';
    const { inventoryRepository } = await import('@acme/platform-core/repositories/inventory.server');
    await inventoryRepository.read('shop');

    expect(jsonImportCount).toBe(1);
    expect(sqliteImportCount).toBe(0);
    expect(prismaImportCount).toBe(0);
    expect(jsonRepo.read).toHaveBeenCalledWith('shop');
  });

  it('getRepo uses sqlite backend when configured', async () => {
    process.env.INVENTORY_BACKEND = 'sqlite';
    const { inventoryRepository } = await import('@acme/platform-core/repositories/inventory.server');
    await inventoryRepository.read('shop');

    expect(sqliteImportCount).toBe(1);
    expect(jsonImportCount).toBe(0);
    expect(prismaImportCount).toBe(0);
    expect(sqliteRepo.read).toHaveBeenCalledWith('shop');
  });

  it('variantKey sorts attributes and falls back to sku', async () => {
    const { variantKey } = await import('@acme/platform-core/repositories/inventory.server');
    expect(variantKey('sku', { b: '2', a: '1' })).toBe('sku#a:1|b:2');
    expect(variantKey('sku', {})).toBe('sku');
  });

  it('readInventoryMap returns items keyed by variantKey', async () => {
    const items = [
      { sku: 'sku1', variantAttributes: { size: 'M', color: 'red' } },
      { sku: 'sku2', variantAttributes: {} },
    ] as any[];
    process.env.INVENTORY_BACKEND = 'json';
    jsonRepo.read.mockResolvedValue(items);

    const { readInventoryMap, variantKey } = await import('@acme/platform-core/repositories/inventory.server');
    const map = await readInventoryMap('shop1');

    const key1 = variantKey(items[0].sku, items[0].variantAttributes);
    const key2 = variantKey(items[1].sku, items[1].variantAttributes);

    expect(map).toEqual({ [key1]: items[0], [key2]: items[1] });
    expect(jsonRepo.read).toHaveBeenCalledWith('shop1');
  });
});

