import { describe, expect, it, jest } from '@jest/globals';

import { expectInvalidAuthEnvWithConfigEnv } from '../../../test/utils/expectInvalidAuthEnv';

import { withEnv } from './test-helpers';

const NEXT = 'nextauth-secret-32-chars-long-string!';
const SESSION = 'session-secret-32-chars-long-string!';
const OAUTH_ISSUER = 'https://auth.example.com/realms/base-shop';
const OAUTH_REDIRECT_ORIGIN = 'https://shop.example.com';

type EnvOverrides = Record<string, string | undefined>;

const prodEnv = (overrides: EnvOverrides = {}): EnvOverrides => ({
  NODE_ENV: 'production',
  NEXTAUTH_SECRET: NEXT,
  SESSION_SECRET: SESSION,
  OAUTH_ISSUER,
  OAUTH_REDIRECT_ORIGIN,
  ...overrides,
});

const devEnv = (overrides: EnvOverrides = {}): EnvOverrides => ({
  NODE_ENV: 'development',
  NEXTAUTH_SECRET: NEXT,
  SESSION_SECRET: SESSION,
  OAUTH_ISSUER,
  OAUTH_REDIRECT_ORIGIN,
  ...overrides,
});

const expectInvalidProd = (
  overrides: EnvOverrides,
  accessor: (env: Record<string, unknown>) => unknown,
  consoleErrorSpy?: { mockRestore: () => void },
) =>
  expectInvalidAuthEnvWithConfigEnv({
    env: prodEnv(overrides),
    accessor: (auth) => accessor(auth.authEnv as Record<string, unknown>),
    consoleErrorSpy,
  });

const expectInvalidDev = (
  overrides: EnvOverrides,
  accessor: (env: Record<string, unknown>) => unknown,
  consoleErrorSpy?: { mockRestore: () => void },
) =>
  expectInvalidAuthEnvWithConfigEnv({
    env: devEnv(overrides),
    accessor: (auth) => accessor(auth.authEnv as Record<string, unknown>),
    consoleErrorSpy,
  });

// ---------------- auth ----------------
describe('auth env extras', () => {
  it('requires redis secrets when SESSION_STORE=redis', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expectInvalidProd(
      {
        SESSION_STORE: 'redis',
        UPSTASH_REDIS_REST_URL: 'https://u.example',
        UPSTASH_REDIS_REST_TOKEN: undefined,
      },
      (env) => env.UPSTASH_REDIS_REST_TOKEN,
      spy,
    );
    spy.mockRestore();
  });

  it('parses booleans and TTL values', async () => {
    await withEnv(
      devEnv({
        SESSION_STORE: 'redis',
        UPSTASH_REDIS_REST_URL: 'https://u.example',
        UPSTASH_REDIS_REST_TOKEN: 't'.repeat(32),
        ALLOW_GUEST: '1',
        ENFORCE_2FA: 'false',
        AUTH_TOKEN_TTL: '30',
      }),
      async () => {
        const { loadAuthEnv } = await import('../auth.ts');
        const cfg = loadAuthEnv();
        expect(cfg.ALLOW_GUEST).toBe(true);
        expect(cfg.ENFORCE_2FA).toBe(false);
        expect(cfg.AUTH_TOKEN_TTL).toBe(30);
        expect(cfg.SESSION_STORE).toBe('redis');
      },
    );
  });

  it('requires rate limit token pair', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expectInvalidProd(
      {
        LOGIN_RATE_LIMIT_REDIS_URL: 'https://r.example',
        LOGIN_RATE_LIMIT_REDIS_TOKEN: undefined,
      },
      (env) => env.LOGIN_RATE_LIMIT_REDIS_TOKEN,
      spy,
    );
    spy.mockRestore();
  });
});

// ---------------- email ----------------
describe('email env extras', () => {
  it('defaults provider and coerces values', async () => {
    await withEnv(devEnv({ SMTP_PORT: '2525', SMTP_SECURE: 'yes' }), async () => {
      const mod = await import('../email.ts');
      expect(mod.emailEnv.EMAIL_PROVIDER).toBe('smtp');
      expect(mod.emailEnv.SMTP_PORT).toBe(2525);
      expect(mod.emailEnv.SMTP_SECURE).toBe(true);
    });
  });
});

// ---------------- payments ----------------
describe('payments env extras', () => {
  it('parses PAYMENTS_SANDBOX boolean', async () => {
    await withEnv(prodEnv({
      PAYMENTS_PROVIDER: 'stripe',
      STRIPE_SECRET_KEY: 'sk',
      STRIPE_WEBHOOK_SECRET: 'wh',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk',
      PAYMENTS_SANDBOX: 'false',
    }), async () => {
      const { loadPaymentsEnv } = await import('../payments.ts');
      const cfg = loadPaymentsEnv();
      expect(cfg.PAYMENTS_SANDBOX).toBe(false);
    });
  });
});

// ---------------- shipping ----------------
describe('shipping env extras', () => {
  it('parses local pickup and country codes', async () => {
    await withEnv(prodEnv({
      SHIPPING_PROVIDER: 'none',
      LOCAL_PICKUP_ENABLED: 'yes',
      DEFAULT_COUNTRY: 'us',
    }), async () => {
      const { loadShippingEnv } = await import('../shipping.ts');
      const cfg = loadShippingEnv();
      expect(cfg.LOCAL_PICKUP_ENABLED).toBe(true);
      expect(cfg.DEFAULT_COUNTRY).toBe('US');
    });
  });

  it('rejects unknown providers', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(async () => {
      await withEnv({ SHIPPING_PROVIDER: 'unknown' } as EnvOverrides, async () => {
        await import('../shipping.ts');
      });
    }).rejects.toThrow('Invalid shipping environment variables');
    spy.mockRestore();
  });
});

// ---------------- cms ----------------
describe('cms env extras', () => {
  it('coerces booleans and arrays', async () => {
    await withEnv(devEnv({
      CMS_DRAFTS_ENABLED: '1',
      CMS_DRAFTS_DISABLED_PATHS: '/a, /b ,',
      CMS_SEARCH_ENABLED: 'true',
      CMS_SPACE_URL: 'https://cms.example.com',
      CMS_ACCESS_TOKEN: 'token',
      SANITY_API_VERSION: 'v1',
      SANITY_PROJECT_ID: 'pid',
      SANITY_DATASET: 'ds',
      SANITY_API_TOKEN: 'sat',
      SANITY_PREVIEW_SECRET: 'preview',
    }), async () => {
      const mod = await import('../cms.ts');
      expect(mod.cmsEnv.CMS_DRAFTS_ENABLED).toBe(true);
      expect(mod.cmsEnv.CMS_DRAFTS_DISABLED_PATHS).toEqual(['/a', '/b']);
      expect(mod.cmsEnv.CMS_SEARCH_ENABLED).toBe(true);
      expect(mod.cmsEnv.CMS_PAGINATION_LIMIT).toBe(100);
    });
  });
});
