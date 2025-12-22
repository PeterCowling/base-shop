/* i18n-exempt file -- TEST-1234 test env fixtures [ttl=2026-12-31] */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export type WithTempRepoOptions = {
  prefix?: string;
  shopId?: string;
  setCommonEnv?: boolean;
  createShopDir?: boolean;
};

/**
 * Creates an isolated temporary repository structure under a new CWD and
 * invokes the callback. Restores the original CWD afterwards.
 *
 * Defaults:
 * - Creates `data/shops/<shopId>` (shopId defaults to "test").
 * - Sets common env secrets used by routes during tests.
 */
export async function withTempRepo(
  cb: (dir: string) => Promise<void>,
  opts: WithTempRepoOptions = {}
): Promise<void> {
  const { prefix = 'repo-', shopId = 'test', setCommonEnv = true, createShopDir = true } = opts;
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  const shopDir = path.join(dir, 'data', 'shops', shopId);
  if (createShopDir) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- TEST-1234 temp fixture directory
    await fs.mkdir(shopDir, { recursive: true });
  }

  const cwd = process.cwd();
  process.chdir(dir);

  // Response.json shim is loaded globally via test/setup-response-json.ts

  // Polyfill setImmediate used by fast-csv in some test environments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TEST-1234 setImmediate shim needs generic arguments
  (global as any).setImmediate ||= ((fn: (...args: any[]) => void, ...args: any[]) =>
    setTimeout(fn, 0, ...args));

  if (setCommonEnv) {
    Object.assign(process.env, {
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'test-nextauth-secret-32-chars-long-string!',
      SESSION_SECRET: process.env.SESSION_SECRET || 'test-session-secret-32-chars-long-string!',
      CART_COOKIE_SECRET: process.env.CART_COOKIE_SECRET || 'test-cart-secret',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test',
      SKIP_STOCK_ALERT: process.env.SKIP_STOCK_ALERT || '1',
      CMS_SPACE_URL: process.env.CMS_SPACE_URL || 'http://example.com',
      CMS_ACCESS_TOKEN: process.env.CMS_ACCESS_TOKEN || 'token',
      SANITY_API_VERSION: process.env.SANITY_API_VERSION || '2024-01-01',
    });
  }

  jest.resetModules();
  try {
    await cb(dir);
  } finally {
    process.chdir(cwd);
  }
}
