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

jest.mock('../inventory.sqlite.server', () => ({
  sqliteInventoryRepository: mockSqlite,
}));

jest.mock('../inventory.json.server', () => ({
  jsonInventoryRepository: mockJson,
}));

jest.mock('../inventory.prisma.server', () => ({
  prismaInventoryRepository: mockPrisma,
}));

describe('inventory.server branching', () => {
  const origBackend = process.env.INVENTORY_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;
  const origNextAuth = process.env.NEXTAUTH_SECRET;
  const origSession = process.env.SESSION_SECRET;

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
    if (origDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = origDbUrl;
    }
    if (origNextAuth === undefined) {
      delete process.env.NEXTAUTH_SECRET;
    } else {
      process.env.NEXTAUTH_SECRET = origNextAuth;
    }
    if (origSession === undefined) {
      delete process.env.SESSION_SECRET;
    } else {
      process.env.SESSION_SECRET = origSession;
    }
  });

  it('delegates to JSON repository when INVENTORY_BACKEND="sqlite"', async () => {
    process.env.INVENTORY_BACKEND = 'sqlite';
    const { inventoryRepository } = await import('../inventory.server');
    const mutate = jest.fn();

    await inventoryRepository.write('shop', []);
    await inventoryRepository.update('shop', 'sku', { size: 'L' }, mutate);

    expect(mockJson.write).toHaveBeenCalledWith('shop', []);
    expect(mockJson.update).toHaveBeenCalledWith('shop', 'sku', { size: 'L' }, mutate);
    expect(mockSqlite.write).not.toHaveBeenCalled();
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

  it('uses Prisma repository when DATABASE_URL and secrets are valid', async () => {
    process.env.DATABASE_URL = 'postgres://test';
    process.env.NEXTAUTH_SECRET = 'a'.repeat(32);
    const { inventoryRepository } = await import('../inventory.server');

    await inventoryRepository.read('shop');
    expect(mockPrisma.read).toHaveBeenCalledWith('shop');
    expect(mockJson.read).not.toHaveBeenCalled();
  });

  it('falls back to JSON when NEXTAUTH_SECRET is too short', async () => {
    process.env.DATABASE_URL = 'postgres://test';
    process.env.NEXTAUTH_SECRET = 'short';
    const { inventoryRepository } = await import('../inventory.server');

    await inventoryRepository.read('shop');
    expect(mockJson.read).toHaveBeenCalled();
    expect(mockPrisma.read).not.toHaveBeenCalled();
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

