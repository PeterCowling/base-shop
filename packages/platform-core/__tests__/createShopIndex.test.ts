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

  it('listThemes returns names of all theme directories', async () => {
    vol.fromJSON(
      {
        '/workspace/base-shop/packages/themes/base/index.ts': '',
        '/workspace/base-shop/packages/themes/extra/index.ts': '',
        '/workspace/base-shop/packages/themes/legacy/index.ts': '',
        '/workspace/base-shop/packages/themes/file.txt': 'not a dir',
      },
      '/'
    );
    const mod = await import('../src/createShop');
    const themes = mod.listThemes().sort();
    expect(themes).toEqual(['base', 'extra', 'legacy']);
  });

  it('syncTheme removes old theme deps, adds new, updates CSS, and writes files', async () => {
    vol.fromJSON(
      {
        '/workspace/base-shop/apps/shop/package.json': JSON.stringify(
          {
            dependencies: {
              '@themes/old': 'workspace:*',
              '@themes/legacy': 'workspace:*',
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
    const writeSpy = jest.spyOn(fs, 'writeFileSync');
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
    expect(writeSpy).toHaveBeenCalledWith(
      'apps/shop/package.json',
      expect.any(String)
    );
    expect(writeSpy).toHaveBeenCalledWith(
      'apps/shop/src/app/globals.css',
      expect.any(String)
    );
    expect(result).toBe(tokens);
    writeSpy.mockRestore();
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

