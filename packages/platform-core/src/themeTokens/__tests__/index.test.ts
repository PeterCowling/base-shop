jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));
jest.mock('node:vm', () => ({
  runInNewContext: jest.fn(),
}));
jest.mock('typescript', () => ({
  __esModule: true,
  default: {
    transpileModule: jest.fn(),
    ModuleKind: { CommonJS: 1 },
  },
}));

import * as fs from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { join } from 'node:path';
import * as themeTokens from '../index';

const transpiled = "module.exports.tokens = { '--foo': 'bar' };";

describe('loadThemeTokensNode', () => {
  const theme = 'demo';
  const rootDir = join(__dirname, '../../../../../');
  const baseDir = join(rootDir, 'packages', 'themes', theme);
  const candidates = [
    join(baseDir, 'tailwind-tokens.js'),
    join(baseDir, 'tailwind-tokens.ts'),
    join(baseDir, 'src', 'tailwind-tokens.ts'),
  ];

  afterEach(() => {
    jest.resetAllMocks();
  });

  it.each([undefined, 'base'])('returns empty object for %s theme', (t) => {
    expect(themeTokens.loadThemeTokensNode(t as any)).toEqual({});
    expect(fs.existsSync).not.toHaveBeenCalled();
  });

  it('returns empty object when no candidate files exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    expect(themeTokens.loadThemeTokensNode(theme)).toEqual({});
    expect(fs.readFileSync).not.toHaveBeenCalled();
    expect(ts.transpileModule).not.toHaveBeenCalled();
    expect(runInNewContext).not.toHaveBeenCalled();
  });

  it('loads tokens from existing file', () => {
    (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('src');
    (ts.transpileModule as jest.Mock).mockReturnValue({ outputText: transpiled });
    (runInNewContext as jest.Mock).mockImplementation((_code, sandbox) => {
      sandbox.module.exports.tokens = { '--foo': 'bar' };
    });

    expect(themeTokens.loadThemeTokensNode(theme)).toEqual({ '--foo': 'bar' });
    expect(fs.readFileSync).toHaveBeenCalledWith(expect.any(String), 'utf8');
    expect(ts.transpileModule).toHaveBeenCalled();
    expect(runInNewContext).toHaveBeenCalledWith(transpiled, expect.any(Object));
  });
});

describe('loadThemeTokensBrowser', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uses tokens from theme package', async () => {
    const realFs = jest.requireActual('node:fs') as typeof fs;
    const dir = join(
      __dirname,
      '../../../../../packages/themes/withTokens/src'
    );
    realFs.mkdirSync(dir, { recursive: true });
    realFs.writeFileSync(
      join(dir, 'index.ts'),
      "export const tokens = { '--bar': { light: 'baz' } } as const;"
    );

    await expect(themeTokens.loadThemeTokensBrowser('withTokens')).resolves.toEqual({
      '--bar': 'baz',
    });

    realFs.rmSync(
      join(__dirname, '../../../../../packages/themes/withTokens'),
      { recursive: true, force: true }
    );
  });

  it.each([undefined, 'base'])('returns base tokens for %s theme', async (t) => {
    await expect(themeTokens.loadThemeTokensBrowser(t as any)).resolves.toEqual(
      themeTokens.baseTokens
    );
  });

  it('falls back to base tokens when imports fail', async () => {
    await expect(themeTokens.loadThemeTokensBrowser('missing')).resolves.toEqual(
      themeTokens.baseTokens
    );
  });

  it.each([
    ['missing module', 'fallback-missing', undefined],
    [
      'module without tokens',
      'fallback-no-tokens',
      "export const foo = 'bar';",
    ],
  ])(
    'uses tailwind tokens when %s',
    async (_label, theme, indexSource) => {
      const realFs = jest.requireActual('node:fs') as typeof fs;
      const baseDir = join(
        __dirname,
        `../../../../../packages/themes/${theme}`
      );
      if (indexSource) {
        const indexDir = join(baseDir, 'src');
        realFs.mkdirSync(indexDir, { recursive: true });
        realFs.writeFileSync(join(indexDir, 'index.ts'), indexSource);
      }
      const tailwindDir = join(baseDir, 'tailwind-tokens', 'src');
      realFs.mkdirSync(tailwindDir, { recursive: true });
      realFs.writeFileSync(
        join(tailwindDir, 'index.ts'),
        "export const tokens = { '--baz': 'qux' } as const;"
      );

      await expect(themeTokens.loadThemeTokensBrowser(theme)).resolves.toEqual({
        '--baz': 'qux',
      });

      realFs.rmSync(baseDir, { recursive: true, force: true });
    }
  );
});

describe('loadThemeTokens', () => {
  const realWindow = global.window as any;

  afterEach(() => {
    (global as any).window = realWindow;
  });

  it('delegates to node loader when window is undefined', async () => {
    delete (global as any).window;
    await expect(themeTokens.loadThemeTokens('base')).resolves.toEqual({});
  });

  it('delegates to browser loader when window exists', async () => {
    (global as any).window = {};
    await expect(themeTokens.loadThemeTokens('base')).resolves.toEqual(
      themeTokens.baseTokens
    );
  });
});
