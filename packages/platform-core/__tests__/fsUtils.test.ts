import { jest } from '@jest/globals';
import { Volume, createFsFromVolume } from 'memfs';

// Mock filesystem using memfs
const vol = new Volume();
const fs = createFsFromVolume(vol);

jest.mock('fs', () => fs);

const loadTokensMock = jest.fn(() => ({}));
jest.mock('../src/createShop/themeUtils', () => ({ loadTokens: loadTokensMock }));

describe('fsUtils', () => {
  beforeEach(() => {
    vol.reset();
    jest.clearAllMocks();
    loadTokensMock.mockReturnValue({});
  });

  it('repoRoot locates workspace marker', async () => {
    vol.fromJSON(
      {
        '/workspace/base-shop/pnpm-workspace.yaml': '',
        '/workspace/base-shop/packages/.gitkeep': '',
      },
      '/'
    );
    const mod = await import('../src/createShop/fsUtils');
    expect(mod.repoRoot()).toBe('/workspace/base-shop');
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
    const mod = await import('../src/createShop/fsUtils');
    const themes = mod.listThemes().sort();
    expect(themes).toEqual(['base', 'extra', 'legacy']);
  });

  it('listThemes returns empty array when readdir fails', async () => {
    const readdirSpy = jest
      .spyOn(fs, 'readdirSync')
      .mockImplementation(() => {
        throw new Error('fail');
      });
    const mod = await import('../src/createShop/fsUtils');
    expect(mod.listThemes()).toEqual([]);
    readdirSpy.mockRestore();
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
    const mod = await import('../src/createShop/fsUtils');
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

  it('syncTheme ignores invalid package.json', async () => {
    vol.fromJSON(
      {
        '/workspace/base-shop/apps/shop/package.json': 'not json',
        '/workspace/base-shop/apps/shop/src/app/globals.css':
          "@import '@themes/old/tokens.css';\n",
      },
      '/'
    );
    const mod = await import('../src/createShop/fsUtils');
    expect(() => mod.syncTheme('shop', 'base')).not.toThrow();
  });

  it('syncTheme ignores unreadable globals.css', async () => {
    vol.fromJSON(
      {
        '/workspace/base-shop/apps/shop/package.json': JSON.stringify(
          { dependencies: {} },
          null,
          2
        ),
        '/workspace/base-shop/apps/shop/src/app/globals.css': '',
      },
      '/'
    );
    const realRead = fs.readFileSync;
    const readSpy = jest
      .spyOn(fs, 'readFileSync')
      .mockImplementation((p: any, enc?: any) => {
        if (p === '/workspace/base-shop/apps/shop/src/app/globals.css') {
          throw new Error('missing');
        }
        return realRead.call(fs, p, enc);
      });
    const mod = await import('../src/createShop/fsUtils');
    expect(() => mod.syncTheme('shop', 'base')).not.toThrow();
    readSpy.mockRestore();
  });
});
