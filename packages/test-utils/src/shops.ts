/* i18n-exempt file -- TEST-1234 test fixtures [ttl=2026-12-31] */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { Session } from 'next-auth';

import { adminSession } from './mocks';

export async function withShop(cb: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'shop-'));
  const cwd = process.cwd();
  process.chdir(dir);
  // Ensure repositories resolve data under this temp directory
  process.env.DATA_ROOT = path.join(dir, 'data', 'shops');
  jest.resetModules();
  try {
    await cb(dir);
  } finally {
    process.chdir(cwd);
  }
}

export type ShopSeed = {
  id: string;
  name: string;
  catalogFilters: unknown[];
  themeId: string;
  themeDefaults?: Record<string, unknown>;
  themeOverrides?: Record<string, unknown>;
  themeTokens?: Record<string, unknown>;
  filterMappings: Record<string, unknown>;
  priceOverrides?: Record<string, unknown>;
  localeOverrides?: Record<string, unknown>;
  [key: string]: unknown;
};

export async function seedShop(
  dir: string,
  shop: ShopSeed = {
    id: 'test',
    name: 'Seed',
    catalogFilters: [],
    themeId: 'base',
    themeDefaults: {},
    themeOverrides: {},
    themeTokens: {},
    filterMappings: {},
    priceOverrides: {},
    localeOverrides: {},
  }
): Promise<void> {
  const shopDir = path.join(dir, 'data', 'shops', shop.id || 'test');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- TEST-1234 temp fixture directory
  await fs.mkdir(shopDir, { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- TEST-1234 temp fixture file
  await fs.writeFile(path.join(shopDir, 'shop.json'), JSON.stringify(shop, null, 2));
}

/**
 * Mocks used by shop-related CMS tests so they don't touch real DB or theme loaders
 */
export function mockShop(tokens: Record<string, string> = {}): void {
  jest.doMock('@acme/platform-core/db', () => ({
    prisma: {
      shop: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockRejectedValue(new Error('no db')),
      },
    },
  }));

  jest.doMock('@acme/config', () => ({
    env: { NEXTAUTH_SECRET: 'test-nextauth-secret-32-chars-long-string!' },
  }));
  jest.doMock('@acme/platform-core/createShop', () => ({
    syncTheme: jest.fn().mockResolvedValue(tokens),
  }));
  jest.doMock('@acme/platform-core/themeTokens', () => ({
    baseTokens: {},
    loadThemeTokens: jest.fn().mockResolvedValue(tokens),
  }));
  const { __setMockSession } = require('next-auth') as {
    __setMockSession: (s: Session | null) => void;
  };
  __setMockSession(adminSession);
}
