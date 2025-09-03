import { jest } from '@jest/globals';
import { Volume, createFsFromVolume } from 'memfs';

// Mock filesystem using memfs
const vol = new Volume();
const fs = createFsFromVolume(vol);

jest.mock('fs', () => fs);

// mock database and theme utils
const prismaMock = {
  shop: { create: jest.fn(async () => ({})) },
  page: { createMany: jest.fn(async () => ({})) },
};

jest.mock('../src/db', () => ({ prisma: prismaMock }));

const loadTokensMock = jest.fn(() => ({}));
jest.mock('../src/createShop/themeUtils', () => ({ loadTokens: loadTokensMock }));

describe('createShop index', () => {
  beforeEach(() => {
    vol.reset();
    jest.clearAllMocks();
    loadTokensMock.mockReturnValue({});
  });

  it('invokes deployShop when deploy option is true', async () => {
    const adapter = {
      scaffold: jest.fn(),
      deploy: jest.fn(() => ({ status: 'success' as const })),
      writeDeployInfo: jest.fn(),
    };
    const mod = await import('../src/createShop');
    const deploySpy = jest
      .spyOn(mod, 'deployShop')
      .mockReturnValue({ status: 'success' as const });
    await mod.createShop('shop-deploy', { theme: 'base' }, { deploy: true }, adapter as any);
    expect(deploySpy).toHaveBeenCalledWith('shop-deploy', undefined, adapter as any);
  });

  it('sets error status when scaffold throws in deployShop', async () => {
    const mod = await import('../src/createShop');
    const adapter = {
      scaffold: jest.fn(() => {
        throw new Error('fail');
      }),
      deploy: jest.fn(() => ({ status: 'success' as const })),
      writeDeployInfo: jest.fn(),
    };
    const result = mod.deployShop('shop-error', undefined, adapter as any);
    expect(result.status).toBe('error');
    expect(result.error).toBe('fail');
    expect(adapter.deploy).toHaveBeenCalled();
    expect(adapter.writeDeployInfo).toHaveBeenCalledWith('shop-error', result);
  });

  it('listThemes returns only theme directories', async () => {
    vol.fromJSON(
      {
        '/workspace/base-shop/packages/themes/base/index.ts': '',
        '/workspace/base-shop/packages/themes/extra/index.ts': '',
        '/workspace/base-shop/packages/themes/file.txt': 'not a dir',
      },
      '/'
    );
    const mod = await import('../src/createShop');
    const themes = mod.listThemes().sort();
    expect(themes).toEqual(['base', 'extra']);
  });

  it('syncTheme updates package.json and globals.css', async () => {
    vol.fromJSON(
      {
        '/workspace/base-shop/apps/shop/package.json': JSON.stringify(
          {
            dependencies: {
              '@themes/old': 'workspace:*',
              lodash: '^1.0.0',
            },
          },
          null,
          2
        ),
        '/workspace/base-shop/apps/shop/src/app/globals.css':
          "@import '@themes/old/tokens.css';\nbody{}",
      },
      '/'
    );
    const tokens = { color: 'blue' };
    loadTokensMock.mockReturnValueOnce(tokens);
    const mod = await import('../src/createShop');
    const result = mod.syncTheme('shop', 'new');
    const pkg = JSON.parse(
      fs.readFileSync('/workspace/base-shop/apps/shop/package.json', 'utf8')
    );
    const css = fs.readFileSync(
      '/workspace/base-shop/apps/shop/src/app/globals.css',
      'utf8'
    );
    expect(pkg).toEqual({
      dependencies: { lodash: '^1.0.0', '@themes/new': 'workspace:*' },
    });
    expect(css).toContain("@themes/new/tokens.css");
    expect(result).toBe(tokens);
  });

  it('syncTheme handles missing files gracefully', async () => {
    const mod = await import('../src/createShop');
    const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const readSpy = jest
      .spyOn(fs, 'readFileSync')
      .mockImplementation(() => {
        throw new Error('missing');
      });
    expect(() => mod.syncTheme('shop-missing', 'base')).not.toThrow();
    existsSpy.mockRestore();
    readSpy.mockRestore();
  });
});

