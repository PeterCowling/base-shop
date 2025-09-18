import { describe, it, expect } from '@jest/globals';
import { withEnv } from './test-helpers';

const NEXT = 'nextauth-secret-32-chars-long-string!';
const SESSION = 'session-secret-32-chars-long-string!';
const CMS = {
  CMS_SPACE_URL: 'https://cms.example.com',
  CMS_ACCESS_TOKEN: 'token',
  SANITY_API_VERSION: 'v1',
  SANITY_PROJECT_ID: 'project',
  SANITY_DATASET: 'production',
  SANITY_API_TOKEN: 'token',
  SANITY_PREVIEW_SECRET: 'preview',
} as const;
const prodBase = {
  NODE_ENV: 'production',
  CART_COOKIE_SECRET: 'cart',
  NEXTAUTH_SECRET: NEXT,
  SESSION_SECRET: SESSION,
  EMAIL_FROM: 'from@example.com',
  ...CMS,
} as const;

// NODE_ENV defaults affecting CART_COOKIE_SECRET and EMAIL_PROVIDER
describe('environment specific defaults', () => {
  const base = {
    NEXTAUTH_SECRET: NEXT,
    SESSION_SECRET: SESSION,
    EMAIL_FROM: 'from@example.com',
  } as const;

  it.each([
    [{ NODE_ENV: 'development', ...base }, 'dev-cart-secret', 'smtp'],
    [{ NODE_ENV: 'test', ...base }, 'dev-cart-secret', 'smtp'],
  ])('defaults applied for %j', async (env, cartSecret, provider) =>
    withEnv(env as any, async () => {
      const { loadCoreEnv } = await import('../core.ts');
      const cfg = loadCoreEnv();
      expect(cfg.CART_COOKIE_SECRET).toBe(cartSecret);
      expect(cfg.EMAIL_PROVIDER).toBe(provider);
    }),
  );

  it('requires CART_COOKIE_SECRET and uses smtp in production', async () =>
    withEnv(prodBase as any, async () => {
      const { loadCoreEnv } = await import('../core.ts');
      const cfg = loadCoreEnv();
      expect(cfg.EMAIL_PROVIDER).toBe('smtp');
    }));

  it('fails without CART_COOKIE_SECRET in production', async () =>
    withEnv({ ...prodBase, CART_COOKIE_SECRET: undefined } as any, async () => {
      await expect(import('../core.ts')).rejects.toThrow(
        'Invalid core environment variables',
      );
    }));
});

// Numeric fields should accept numbers and reject invalid values
describe.each([
  ['DEPOSIT_RELEASE_INTERVAL_MS', '1000', true],
  ['DEPOSIT_RELEASE_INTERVAL_MS', 'oops', false],
  ['CART_TTL', '60', true],
  ['CART_TTL', 'oops', false],
])('%s=%s', (key, value, valid) => {
  const env = { ...prodBase, [key]: value } as Record<string, string>;
  it(valid ? 'accepts numeric value' : 'rejects invalid number', async () =>
    withEnv(env, async () => {
      if (!valid) {
        await expect(import('../core.ts')).rejects.toThrow(
          'Invalid core environment variables',
        );
        return;
      }

      const { loadCoreEnv } = await import('../core.ts');
      const cfg = loadCoreEnv();
      expect(typeof (cfg as any)[key]).toBe('number');
    }));
});

// List parsing for ALLOWED_COUNTRIES
describe('ALLOWED_COUNTRIES parsing', () => {
  it.each([
    ['', undefined],
    ['US,ca', ['US', 'CA']],
  ])('parses %p', async (raw, expected) =>
    withEnv({ ...prodBase, ALLOWED_COUNTRIES: raw } as any, async () => {
      const { loadCoreEnv } = await import('../core.ts');
      const cfg = loadCoreEnv();
      expect(cfg.ALLOWED_COUNTRIES).toEqual(expected);
    }));
});
