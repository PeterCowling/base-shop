jest.mock('node:fs', () => {
  const actual = jest.requireActual('node:fs');
  return { ...actual, existsSync: jest.fn(), readFileSync: jest.fn() };
});

import * as fs from 'node:fs';
import { join } from 'node:path';

import {
  loadThemeTokensNode,
  loadThemeTokensBrowser,
  baseTokens,
} from '../index';

describe('loadThemeTokensNode', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns empty object for base theme', () => {
    expect(loadThemeTokensNode('base')).toEqual({});
  });

  it('loads tokens from existing theme file', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(
      'export const tokens = { "--foo": "bar" } as const;'
    );

    expect(loadThemeTokensNode('custom')).toEqual({ '--foo': 'bar' });
  });
});

describe('loadThemeTokensBrowser', () => {
  const rootDir = join(__dirname, '../../../../..');
  const fancyDir = join(rootDir, 'packages/themes/fancy/src');
  const altDir = join(rootDir, 'packages/themes/alt/tailwind-tokens/src');

  beforeAll(() => {
    const themesDir = join(rootDir, 'packages/themes');
    // Ensure the base themes directory exists before creating fixtures.
    fs.mkdirSync(themesDir, { recursive: true });
    fs.mkdirSync(fancyDir, { recursive: true });
    fs.writeFileSync(
      join(fancyDir, 'index.ts'),
      "export const tokens = { '--fancy': { light: 'pink', dark: 'magenta' } };"
    );
    fs.mkdirSync(altDir, { recursive: true });
    fs.writeFileSync(
      join(altDir, 'index.ts'),
      "export const tokens = { '--alt': 'blue' };"
    );
  });

  afterAll(() => {
    fs.rmSync(join(rootDir, 'packages/themes/fancy'), { recursive: true, force: true });
    fs.rmSync(join(rootDir, 'packages/themes/alt'), { recursive: true, force: true });
  });

  it('uses tokens exported from theme package', async () => {
    await expect(loadThemeTokensBrowser('fancy')).resolves.toEqual({
      '--fancy': 'pink',
    });
  });

  it('falls back to base tokens when imports fail', async () => {
    await expect(loadThemeTokensBrowser('missing')).resolves.toEqual(baseTokens);
  });

  it('uses tailwind token fallback when theme package missing', async () => {
    await expect(loadThemeTokensBrowser('alt')).resolves.toEqual({
      '--alt': 'blue',
    });
  });

  it('returns base tokens for base theme', async () => {
    await expect(loadThemeTokensBrowser('base')).resolves.toEqual(baseTokens);
  });
});
