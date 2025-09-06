import { jest } from '@jest/globals';

let jsonImportCount = 0;
let sqliteImportCount = 0;

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

jest.mock('@acme/platform-core/repositories/inventory.json.server', () => {
  jsonImportCount++;
  return { jsonInventoryRepository: jsonRepo };
});

jest.mock('@acme/platform-core/repositories/inventory.sqlite.server', () => {
  sqliteImportCount++;
  return { sqliteInventoryRepository: sqliteRepo };
});

describe('inventory repository', () => {
  const origBackend = process.env.INVENTORY_BACKEND;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jsonImportCount = 0;
    sqliteImportCount = 0;
  });

  afterEach(() => {
    if (origBackend === undefined) {
      delete process.env.INVENTORY_BACKEND;
    } else {
      process.env.INVENTORY_BACKEND = origBackend;
    }
  });

  it('getRepo falls back to the json backend and caches the promise', async () => {
    const mod1 = await import('@acme/platform-core/repositories/inventory.server');
    await mod1.inventoryRepository.read('s1');
    const mod2 = await import('@acme/platform-core/repositories/inventory.server');
    await mod2.inventoryRepository.read('s2');

    expect(jsonImportCount).toBe(1);
    expect(sqliteImportCount).toBe(0);
    expect(mod1.inventoryRepository).toBe(mod2.inventoryRepository);
    expect(jsonRepo.read).toHaveBeenCalledTimes(2);
  });

  it('getRepo uses sqlite backend when configured', async () => {
    process.env.INVENTORY_BACKEND = 'sqlite';
    const { inventoryRepository } = await import('@acme/platform-core/repositories/inventory.server');
    await inventoryRepository.read('shop');

    expect(sqliteImportCount).toBe(1);
    expect(jsonImportCount).toBe(0);
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
    jsonRepo.read.mockResolvedValue(items);

    const { readInventoryMap, variantKey } = await import('@acme/platform-core/repositories/inventory.server');
    const map = await readInventoryMap('shop1');

    const key1 = variantKey(items[0].sku, items[0].variantAttributes);
    const key2 = variantKey(items[1].sku, items[1].variantAttributes);

    expect(map).toEqual({ [key1]: items[0], [key2]: items[1] });
    expect(jsonRepo.read).toHaveBeenCalledWith('shop1');
  });
});

