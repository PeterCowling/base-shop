import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { Session } from 'next-auth';

export const adminSession = { user: { role: 'admin' } } as unknown as Session;

export async function withShop(cb: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'shop-'));
  const cwd = process.cwd();
  process.chdir(dir);
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
  catalogFilters: any[];
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
  await fs.mkdir(shopDir, { recursive: true });
  await fs.writeFile(path.join(shopDir, 'shop.json'), JSON.stringify(shop, null, 2));
}

/**
 * Mocks used by shop-related CMS tests so they don't touch real DB or theme loaders
 */
export function mockShop(tokens: Record<string, string> = {}): void {
  jest.doMock('@platform-core/db', () => ({
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
  jest.doMock('@platform-core/createShop', () => ({
    syncTheme: jest.fn().mockResolvedValue(tokens),
  }));
  jest.doMock('@platform-core/themeTokens', () => ({
    baseTokens: {},
    loadThemeTokens: jest.fn().mockResolvedValue(tokens),
  }));
  const { __setMockSession } = require('next-auth') as {
    __setMockSession: (s: Session | null) => void;
  };
  __setMockSession(adminSession);
}
