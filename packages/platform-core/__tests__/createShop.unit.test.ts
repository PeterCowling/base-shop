import { jest } from '@jest/globals';
import { createFsFromVolume,Volume } from 'memfs';
import path from 'path';

// mock fs with memfs
const vol = new Volume();
const fs = createFsFromVolume(vol);

jest.mock('fs', () => fs);

// mock prisma
const prismaMock = {
  shop: { create: jest.fn(async () => ({})) },
  page: { createMany: jest.fn(async () => ({})) },
};
jest.mock('../src/db', () => ({ prisma: prismaMock }));

// mock shop name validation
const validateShopName = jest.fn((id: string) => id.toLowerCase());
jest.mock('../src/shops', () => ({ validateShopName }));

// mock tokens loader
const loadTokensMock = jest.fn(() => ({ primary: 'red', secondary: 'green' }));
jest.mock('../src/createShop/themeUtils', () => ({ loadTokens: loadTokensMock }));

describe('createShop', () => {
  beforeEach(() => {
    vol.reset();
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('validates name, merges overrides, and writes shop.json', async () => {
    const { createShop } = await import('../src/createShop');
    await createShop(
      'MyShop',
      { theme: 'base', themeOverrides: { secondary: 'blue' } },
      { deploy: false }
    );
    expect(validateShopName).toHaveBeenCalledWith('MyShop');
    const file = path.join(
      process.cwd(),
      'data',
      'shops',
      'myshop',
      'shop.json'
    );
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(data.themeDefaults).toEqual({ primary: 'red', secondary: 'green' });
    expect(data.themeOverrides).toEqual({ secondary: 'blue' });
    expect(data.themeTokens).toEqual({ primary: 'red', secondary: 'blue' });
  });

  it('seeds pages only when pages array has items', async () => {
    const { createShop } = await import('../src/createShop');
    await createShop('no-pages', { theme: 'base', pages: [] }, { deploy: false });
    expect(prismaMock.page.createMany).not.toHaveBeenCalled();
    await createShop(
      'pages',
      {
        theme: 'base',
        pages: [
          { slug: 'about', title: { en: 'About' }, components: [] } as any,
        ],
      },
      { deploy: false }
    );
    expect(prismaMock.page.createMany).toHaveBeenCalledTimes(1);
    const call = prismaMock.page.createMany.mock.calls[0][0];
    expect(call.data[0]).toMatchObject({ shopId: 'pages', slug: 'about' });
  });

  it('returns pending and skips deploy when deploy=false', async () => {
    const mod = await import('../src/createShop');
    const spy = jest.spyOn(mod, 'deployShop');
    const result = await mod.createShop('pending', { theme: 'base' }, { deploy: false });
    expect(result).toEqual({ status: 'pending' });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('uses mocked deployShop when provided', async () => {
    const mod = await import('../src/createShop');
    const adapter = {
      scaffold: jest.fn(),
      deploy: jest.fn(() => ({ status: 'success' as const })),
      writeDeployInfo: jest.fn(),
    };
    const deploySpy = jest
      .spyOn(mod, 'deployShop')
      .mockReturnValue({ status: 'mocked' } as any);
    const originalImpl = deploySpy.getMockImplementation();
    const result = await mod.createShop('mocked', { theme: 'base' }, undefined, adapter as any);
    expect(deploySpy).toHaveBeenCalledWith('mocked', undefined, adapter);
    expect(deploySpy.getMockImplementation()).not.toBe(originalImpl);
    expect(result).toEqual({ status: 'success' });
    deploySpy.mockRestore();
  });
});

