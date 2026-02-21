import * as fs from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

import ts from 'typescript';

import * as themeTokensBrowser from '../browser';
import * as themeTokens from '../index';

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

  it('loads tokens from workspace root when local tokens are missing', () => {
    const cwdSpy = jest
      .spyOn(process, 'cwd')
      .mockReturnValue(join(rootDir, 'packages', 'platform-core'));
    let workspaceFound = false;

    (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
      if (p === join(rootDir, 'packages', 'platform-core', 'pnpm-workspace.yaml'))
        return false;
      if (p === join(rootDir, 'packages', 'pnpm-workspace.yaml')) return false;
      if (p === join(rootDir, 'pnpm-workspace.yaml')) {
        workspaceFound = true;
        return true;
      }
      if (candidates.includes(p)) return workspaceFound;
      return false;
    });

    (fs.readFileSync as jest.Mock).mockReturnValue('src');
    (ts.transpileModule as jest.Mock).mockReturnValue({ outputText: transpiled });
    (runInNewContext as jest.Mock).mockImplementation((_code, sandbox) => {
      sandbox.module.exports.tokens = { '--foo': 'bar' };
    });

    expect(themeTokens.loadThemeTokensNode(theme)).toEqual({ '--foo': 'bar' });
    cwdSpy.mockRestore();
  });

  it('returns empty object when pnpm-workspace.yaml is never found', () => {
    const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue('/foo/bar');
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    expect(themeTokens.loadThemeTokensNode(theme)).toEqual({});
    expect(fs.readFileSync).not.toHaveBeenCalled();
    cwdSpy.mockRestore();
  });
});

describe('loadThemeTokensBrowser', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uses tokens from theme package', async () => {
    const realFs = jest.requireActual('node:fs') as typeof fs;
    const dir = join(__dirname, '../../../../../packages/themes/withTokens/src');
    realFs.mkdirSync(dir, { recursive: true });
    realFs.writeFileSync(
      join(dir, 'index.ts'),
      "export const tokens = { '--bar': { light: 'baz' } } as const;",
    );

    await expect(themeTokensBrowser.loadThemeTokensBrowser('withTokens')).resolves.toEqual({
      '--bar': 'baz',
    });

    realFs.rmSync(join(__dirname, '../../../../../packages/themes/withTokens'), {
      recursive: true,
      force: true,
    });
  });

  it.each([undefined, 'base'])('returns base tokens for %s theme', async (t) => {
    await expect(themeTokensBrowser.loadThemeTokensBrowser(t as any)).resolves.toEqual(
      themeTokensBrowser.baseTokens,
    );
  });

  it('falls back to base tokens when imports fail', async () => {
    await expect(themeTokensBrowser.loadThemeTokensBrowser('missing')).resolves.toEqual(
      themeTokensBrowser.baseTokens,
    );
  });

  it.each([
    ['missing module', 'fallback-missing', undefined],
    ['module without tokens', 'fallback-no-tokens', "export const foo = 'bar';"],
  ])('uses tailwind tokens when %s', async (_label, theme, indexSource) => {
    const realFs = jest.requireActual('node:fs') as typeof fs;
    const baseDir = join(__dirname, `../../../../../packages/themes/${theme}`);
    if (indexSource) {
      const indexDir = join(baseDir, 'src');
      realFs.mkdirSync(indexDir, { recursive: true });
      realFs.writeFileSync(join(indexDir, 'index.ts'), indexSource);
    }
    const tailwindDir = join(baseDir, 'tailwind-tokens', 'src');
    realFs.mkdirSync(tailwindDir, { recursive: true });
    realFs.writeFileSync(
      join(tailwindDir, 'index.ts'),
      "export const tokens = { '--baz': 'qux' } as const;",
    );

    await expect(themeTokensBrowser.loadThemeTokensBrowser(theme)).resolves.toEqual({
      '--baz': 'qux',
    });

    realFs.rmSync(baseDir, { recursive: true, force: true });
  });
});

describe('loadThemeTokens', () => {
  it('node entrypoint delegates to node loader', async () => {
    (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
    (fs.readFileSync as jest.Mock).mockReturnValue("export const tokens = { '--color-bg': '#bcd' };");
    (ts.transpileModule as jest.Mock).mockReturnValue({
      outputText: "module.exports.tokens = { '--color-bg': '#bcd' };",
    });
    (runInNewContext as jest.Mock).mockImplementation((_code, sandbox) => {
      sandbox.module.exports.tokens = { '--color-bg': '#bcd' };
    });

    await expect(themeTokens.loadThemeTokens('dark')).resolves.toEqual({
      '--color-bg': '#bcd',
    });
  });

  it('browser entrypoint delegates to browser loader', async () => {
    const realFs = jest.requireActual('node:fs') as typeof fs;
    const dir = join(__dirname, '../../../../../packages/themes/delegation/src');
    realFs.mkdirSync(dir, { recursive: true });
    realFs.writeFileSync(
      join(dir, 'index.ts'),
      "export const tokens = { '--color-bg': { light: '#def' } } as const;",
    );

    await expect(themeTokensBrowser.loadThemeTokens('delegation')).resolves.toEqual({
      '--color-bg': '#def',
    });

    realFs.rmSync(join(__dirname, '../../../../../packages/themes/delegation'), {
      recursive: true,
      force: true,
    });
  });
});
