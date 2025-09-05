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

jest.mock('../inventory.sqlite.server', () => ({
  sqliteInventoryRepository: mockSqlite,
}));

jest.mock('../inventory.json.server', () => ({
  jsonInventoryRepository: mockJson,
}));

describe('inventory.server branching', () => {
  const origBackend = process.env.INVENTORY_BACKEND;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (origBackend === undefined) {
      delete process.env.INVENTORY_BACKEND;
    } else {
      process.env.INVENTORY_BACKEND = origBackend;
    }
  });

  it('delegates to sqlite repository when INVENTORY_BACKEND="sqlite"', async () => {
    process.env.INVENTORY_BACKEND = 'sqlite';
    const { inventoryRepository } = await import('../inventory.server');
    const mutate = jest.fn();

    await inventoryRepository.write('shop', []);
    await inventoryRepository.update('shop', 'sku', { size: 'L' }, mutate);

    expect(mockSqlite.write).toHaveBeenCalledWith('shop', []);
    expect(mockSqlite.update).toHaveBeenCalledWith('shop', 'sku', { size: 'L' }, mutate);
    expect(mockJson.write).not.toHaveBeenCalled();
  });

  it('uses JSON repository when INVENTORY_BACKEND is not "sqlite"', async () => {
    delete process.env.INVENTORY_BACKEND;
    const { inventoryRepository } = await import('../inventory.server');
    const mutate = jest.fn();

    await inventoryRepository.write('shop', []);
    await inventoryRepository.update('shop', 'sku', {}, mutate);

    expect(mockJson.write).toHaveBeenCalledWith('shop', []);
    expect(mockJson.update).toHaveBeenCalledWith('shop', 'sku', {}, mutate);
    expect(mockSqlite.write).not.toHaveBeenCalled();
  });

  it('variantKey handles attrs', async () => {
    const { variantKey } = await import('../inventory.server');
    expect(variantKey('sku', { b: '2', a: '1' })).toBe('sku#a:1|b:2');
    expect(variantKey('sku', {})).toBe('sku');
  });

  it('readInventoryMap returns keys using variantKey', async () => {
    const { readInventoryMap, inventoryRepository, variantKey } = await import('../inventory.server');
    const items = [
      { sku: 's1', variantAttributes: { color: 'red' } },
      { sku: 's2', variantAttributes: {} },
    ] as any[];

    jest.spyOn(inventoryRepository, 'read').mockResolvedValue(items);

    const result = await readInventoryMap('shop');
    const key1 = variantKey('s1', { color: 'red' });
    const key2 = variantKey('s2', {});

    expect(result).toEqual({
      [key1]: items[0],
      [key2]: items[1],
    });
    expect(inventoryRepository.read).toHaveBeenCalledWith('shop');
  });
});

