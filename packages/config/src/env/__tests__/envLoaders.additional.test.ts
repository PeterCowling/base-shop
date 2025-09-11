import { describe, it, expect } from '@jest/globals';
import { withEnv } from './test-helpers';

const NEXT = 'nextauth-secret-32-chars-long-string!';
const SESSION = 'session-secret-32-chars-long-string!';

// ---------------- auth ----------------
describe('auth env extras', () => {
  const base = { NEXTAUTH_SECRET: NEXT, SESSION_SECRET: SESSION } as const;

  it('requires redis secrets when SESSION_STORE=redis', async () => {
    await withEnv({
      NODE_ENV: 'production',
      ...base,
      SESSION_STORE: 'redis',
      UPSTASH_REDIS_REST_URL: 'https://u.example',
    } as any, async () => {
      await expect(import('../auth.ts')).rejects.toThrow(
        'Invalid auth environment variables',
      );
    });
  });

  it('parses booleans and TTL values', async () => {
    await withEnv({
      NODE_ENV: 'development',
      ...base,
      SESSION_STORE: 'redis',
      UPSTASH_REDIS_REST_URL: 'https://u.example',
      UPSTASH_REDIS_REST_TOKEN: 't'.repeat(32),
      ALLOW_GUEST: '1',
      ENFORCE_2FA: 'false',
      AUTH_TOKEN_TTL: '30',
    } as any, async () => {
      const mod = await import('../auth.ts');
      const cfg = mod.loadAuthEnv();
      expect(cfg.ALLOW_GUEST).toBe(true);
      expect(cfg.ENFORCE_2FA).toBe(false);
      expect(cfg.AUTH_TOKEN_TTL).toBe(30);
      expect(cfg.SESSION_STORE).toBe('redis');
    });
  });

  it('requires rate limit token pair', async () => {
    await withEnv({
      NODE_ENV: 'production',
      ...base,
      LOGIN_RATE_LIMIT_REDIS_URL: 'https://r.example',
    } as any, async () => {
      await expect(import('../auth.ts')).rejects.toThrow(
        'Invalid auth environment variables',
      );
    });
  });
});

// ---------------- email ----------------
describe('email env extras', () => {
  it('defaults provider and coerces values', async () => {
    await withEnv({
      NODE_ENV: 'development',
      SMTP_PORT: '2525',
      SMTP_SECURE: 'yes',
    } as any, async () => {
      const mod = await import('../email.ts');
      expect(mod.emailEnv.EMAIL_PROVIDER).toBe('noop');
      expect(mod.emailEnv.SMTP_PORT).toBe(2525);
      expect(mod.emailEnv.SMTP_SECURE).toBe(true);
    });
  });
});

// ---------------- payments ----------------
describe('payments env extras', () => {
  it('parses PAYMENTS_SANDBOX boolean', async () => {
    await withEnv({
      PAYMENTS_PROVIDER: 'stripe',
      STRIPE_SECRET_KEY: 'sk',
      STRIPE_WEBHOOK_SECRET: 'wh',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk',
      PAYMENTS_SANDBOX: 'false',
    } as any, async () => {
      const { loadPaymentsEnv } = await import('../payments.ts');
      const cfg = loadPaymentsEnv();
      expect(cfg.PAYMENTS_SANDBOX).toBe(false);
    });
  });
});

// ---------------- shipping ----------------
describe('shipping env extras', () => {
  it('parses local pickup and country codes', async () => {
    await withEnv({
      SHIPPING_PROVIDER: 'none',
      LOCAL_PICKUP_ENABLED: 'yes',
      DEFAULT_COUNTRY: 'us',
    } as any, async () => {
      const { loadShippingEnv } = await import('../shipping.ts');
      const cfg = loadShippingEnv();
      expect(cfg.LOCAL_PICKUP_ENABLED).toBe(true);
      expect(cfg.DEFAULT_COUNTRY).toBe('US');
    });
  });

  it('rejects unknown providers', async () => {
    await withEnv({ SHIPPING_PROVIDER: 'unknown' } as any, async () => {
      await expect(import('../shipping.ts')).rejects.toThrow(
        'Invalid shipping environment variables',
      );
    });
  });
});

// ---------------- cms ----------------
describe('cms env extras', () => {
  it('coerces booleans and arrays', async () => {
    await withEnv({
      NODE_ENV: 'development',
      CMS_DRAFTS_ENABLED: '1',
      CMS_DRAFTS_DISABLED_PATHS: '/a, /b ,',
      CMS_SEARCH_ENABLED: 'true',
      CMS_SPACE_URL: 'https://cms.example.com',
      CMS_ACCESS_TOKEN: 'token',
      SANITY_API_VERSION: 'v',
      SANITY_PROJECT_ID: 'pid',
      SANITY_DATASET: 'ds',
      SANITY_API_TOKEN: 'sat',
      SANITY_PREVIEW_SECRET: 'preview',
    } as any, async () => {
      const mod = await import('../cms.ts');
      expect(mod.cmsEnv.CMS_DRAFTS_ENABLED).toBe(true);
      expect(mod.cmsEnv.CMS_DRAFTS_DISABLED_PATHS).toEqual(['/a', '/b']);
      expect(mod.cmsEnv.CMS_SEARCH_ENABLED).toBe(true);
      expect(mod.cmsEnv.CMS_PAGINATION_LIMIT).toBe(100);
    });
  });
});

