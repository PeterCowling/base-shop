import { jest } from '@jest/globals';

let sqliteImportCount = 0;
let jsonImportCount = 0;

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

jest.mock('../inventory.sqlite.server', () => {
  sqliteImportCount++;
  return { sqliteInventoryRepository: mockSqlite };
});

jest.mock('../inventory.json.server', () => {
  jsonImportCount++;
  return { jsonInventoryRepository: mockJson };
});

describe('inventory backend', () => {
  const origBackend = process.env.INVENTORY_BACKEND;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    sqliteImportCount = 0;
    jsonImportCount = 0;
  });

  afterEach(() => {
    if (origBackend === undefined) {
      delete process.env.INVENTORY_BACKEND;
    } else {
      process.env.INVENTORY_BACKEND = origBackend;
    }
    jest.restoreAllMocks();
  });

  it('imports sqlite backend once', async () => {
    process.env.INVENTORY_BACKEND = 'sqlite';
    const { inventoryRepository } = await import('../inventory.server');

    await inventoryRepository.read('shop1');
    await inventoryRepository.read('shop2');

    expect(sqliteImportCount).toBe(1);
    expect(jsonImportCount).toBe(0);
    expect(mockSqlite.read).toHaveBeenCalledTimes(2);
  });

  it('imports json backend once', async () => {
    process.env.INVENTORY_BACKEND = 'json';
    const { inventoryRepository } = await import('../inventory.server');

    await inventoryRepository.read('shop1');
    await inventoryRepository.read('shop2');

    expect(jsonImportCount).toBe(1);
    expect(sqliteImportCount).toBe(0);
    expect(mockJson.read).toHaveBeenCalledTimes(2);
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

