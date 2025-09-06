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

describe('inventory repository backend selection', () => {
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
  });

  it('falls back to the JSON repository when INVENTORY_BACKEND is not "sqlite"', async () => {
    delete process.env.INVENTORY_BACKEND;
    const { inventoryRepository } = await import('../inventory.server');
    const mutate = jest.fn();

    await inventoryRepository.read('shop');
    await inventoryRepository.write('shop', []);
    await inventoryRepository.update('shop', 'sku', {}, mutate);

    expect(mockJson.read).toHaveBeenCalledWith('shop');
    expect(mockJson.write).toHaveBeenCalledWith('shop', []);
    expect(mockJson.update).toHaveBeenCalledWith('shop', 'sku', {}, mutate);
    expect(mockSqlite.read).not.toHaveBeenCalled();
  });
});
