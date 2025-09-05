jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

import * as fs from 'node:fs';
import { join } from 'node:path';
import * as themeTokens from '../index';

const tokenSource = "export const tokens = { '--foo': 'bar' } as const;";

describe('loadThemeTokensNode', () => {
  const theme = 'demo';
  const baseDir = join('packages', 'themes', theme);
  const candidates = [
    join(baseDir, 'tailwind-tokens.js'),
    join(baseDir, 'tailwind-tokens.ts'),
    join(baseDir, 'src', 'tailwind-tokens.ts'),
  ];

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns empty object when no candidate files exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    expect(themeTokens.loadThemeTokensNode(theme)).toEqual({});
    expect(fs.readFileSync).not.toHaveBeenCalled();
  });

  it.each(candidates)('loads tokens from %s', (hit) => {
    (fs.existsSync as jest.Mock).mockImplementation((p) => p === hit);
    (fs.readFileSync as jest.Mock).mockReturnValue(tokenSource);

    expect(themeTokens.loadThemeTokensNode(theme)).toEqual({ '--foo': 'bar' });
    expect(fs.readFileSync).toHaveBeenCalledWith(hit, 'utf8');
  });
});

describe('loadThemeTokensBrowser', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uses tokens from theme package', async () => {
    jest.mock(
      '@themes/withTokens',
      () => ({
        __esModule: true,
        tokens: { '--bar': { light: 'baz' } },
      }),
      { virtual: true }
    );

    await expect(themeTokens.loadThemeTokensBrowser('withTokens')).resolves.toEqual({
      '--bar': 'baz',
    });
  });

  it('falls back to tailwind token module', async () => {
    jest.mock('@themes/noTokens', () => ({ __esModule: true }), { virtual: true });
    jest.mock(
      '@themes/noTokens/tailwind-tokens',
      () => ({
        __esModule: true,
        tokens: { '--alt': 'blue' },
      }),
      { virtual: true }
    );

    await expect(themeTokens.loadThemeTokensBrowser('noTokens')).resolves.toEqual({
      '--alt': 'blue',
    });
  });

  it('returns base tokens when imports fail', async () => {
    await expect(themeTokens.loadThemeTokensBrowser('missing')).resolves.toEqual(
      themeTokens.baseTokens
    );
  });

  it('merges partial overrides with base tokens and tolerates invalid values', async () => {
    jest.mock(
      '@themes/partial',
      () => ({
        __esModule: true,
        tokens: {
          '--color-bg': { light: '123 50% 50%' },
          '--bogus': { light: 42 as any },
        },
      }),
      { virtual: true }
    );

    const tokens = await themeTokens.loadThemeTokensBrowser('partial');
    const merged = { ...themeTokens.baseTokens, ...tokens } as Record<string, any>;
    expect(merged['--color-bg']).toBe('123 50% 50%');
    expect(merged['--color-fg']).toBe(themeTokens.baseTokens['--color-fg']);
    expect(merged['--bogus']).toBe(42);
  });
});

describe('loadThemeTokens', () => {
  const realWindow = global.window as unknown;

  afterEach(() => {
    (global as any).window = realWindow;
    jest.restoreAllMocks();
  });

  it('delegates to node loader when window is undefined', async () => {
    const nodeSpy = jest
      .spyOn(themeTokens, 'loadThemeTokensNode')
      .mockReturnValue({ '--foo': 'bar' });
    (global as any).window = undefined;

    await expect(themeTokens.loadThemeTokens('dark')).resolves.toEqual({
      '--foo': 'bar',
    });
    expect(nodeSpy).toHaveBeenCalledWith('dark');
  });

  it('delegates to browser loader when window exists', async () => {
    const browserSpy = jest
      .spyOn(themeTokens, 'loadThemeTokensBrowser')
      .mockResolvedValue({ '--foo': 'baz' });
    (global as any).window = {};

    await expect(themeTokens.loadThemeTokens('light')).resolves.toEqual({
      '--foo': 'baz',
    });
    expect(browserSpy).toHaveBeenCalledWith('light');
  });
});
