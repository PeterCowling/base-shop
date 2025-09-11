import { jest } from '@jest/globals';

let jsonImportCount = 0;
let prismaImportCount = 0;

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

jest.mock('../inventory.json.server', () => {
  jsonImportCount++;
  return { jsonInventoryRepository: mockJson };
});

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
    options: any,
  ) => {
    const backend = process.env[options.backendEnvVar];
    if (backend === 'json') {
      return await jsonModule();
    }
    return await prismaModule();
  },
}));

describe('inventory backend', () => {
  const origBackend = process.env.INVENTORY_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jsonImportCount = 0;
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
    jest.restoreAllMocks();
  });

  it('imports prisma backend once by default', async () => {
    const { inventoryRepository } = await import('../inventory.server');

    await inventoryRepository.read('shop1');
    await inventoryRepository.read('shop2');

    expect(prismaImportCount).toBe(1);
    expect(jsonImportCount).toBe(0);
    expect(mockPrisma.read).toHaveBeenCalledTimes(2);
  });

  it('variantKey sorts attribute keys', async () => {
    const { variantKey } = await import('../inventory.server');
    const key = variantKey('sku', { b: '2', a: '1' });
    expect(key).toBe('sku#a:1|b:2');
  });

  it('readInventoryMap returns objects keyed by variantKey', async () => {
    const { readInventoryMap, variantKey, inventoryRepository } = await import('../inventory.server');

    const items = [
      { sku: 'sku1', variantAttributes: { size: 'M', color: 'red' } },
      { sku: 'sku2', variantAttributes: {} },
    ] as any[];

    jest
      .spyOn(inventoryRepository, 'read')
      .mockResolvedValue(items);

    const result = await readInventoryMap('shop');

    const key1 = variantKey(items[0].sku, items[0].variantAttributes);
    const key2 = variantKey(items[1].sku, items[1].variantAttributes);

    expect(result).toEqual({
      [key1]: items[0],
      [key2]: items[1],
    });
    expect(inventoryRepository.read).toHaveBeenCalledWith('shop');
  });
});

