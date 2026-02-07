import { describe, expect,it } from '@jest/globals';

import { createExpectInvalidAuthEnv } from '../../../test/utils/expectInvalidAuthEnv';

import { withEnv } from './test-helpers';

const NEXT = 'nextauth-secret-32-chars-long-string!';
const SESSION = 'session-secret-32-chars-long-string!';
const JWT_SECRET = 'jwt-secret-32-chars-long-string!';
const OAUTH_CLIENT_SECRET = 'oauth-secret-32-chars-long-string!';
const OAUTH_ISSUER = 'https://auth.example.com/realms/base-shop';
const OAUTH_REDIRECT_ORIGIN = 'https://shop.example.com';

const expectInvalidAuth = createExpectInvalidAuthEnv(withEnv);

// ------------ auth ------------
describe('auth env', () => {
  const base = {
    NEXTAUTH_SECRET: NEXT,
    SESSION_SECRET: SESSION,
    OAUTH_ISSUER,
    OAUTH_REDIRECT_ORIGIN,
  };

  describe.each([
    [{ NODE_ENV: 'production', ...base, AUTH_PROVIDER: 'local', AUTH_TOKEN_TTL: '60s' }],
    [{ NODE_ENV: 'development', AUTH_PROVIDER: 'local', AUTH_TOKEN_TTL: '1m' }],
    [{ NODE_ENV: 'test', ...base, AUTH_PROVIDER: 'local', AUTH_TOKEN_TTL: '30s' }],
  ])('loadAuthEnv %j', (env) => {
    it('parses and toggles correctly', async () =>
      withEnv(env as any, async () => {
        const { loadAuthEnv } = await import('../auth.ts');
        const cfg = loadAuthEnv();
        expect(cfg.AUTH_PROVIDER).toBe('local');
      }));

    it('validates NEXTAUTH_SECRET requirement', async () => {
      if (env.NODE_ENV === 'production') {
        await expectInvalidAuth({
          env: env as Record<string, string>,
          accessor: (auth) =>
            auth.loadAuthEnv({
              ...(env as Record<string, string | undefined>),
              NEXTAUTH_SECRET: undefined,
            } as any),
        });
        return;
      }

      await withEnv(env as any, async () => {
        const { loadAuthEnv } = await import('../auth.ts');
        expect(() =>
          loadAuthEnv({
            ...(env as Record<string, string | undefined>),
            NEXTAUTH_SECRET: undefined,
          } as any),
        ).not.toThrow();
      });
    });
  });

  it('requires JWT_SECRET when AUTH_PROVIDER=jwt', async () =>
    expectInvalidAuth({
      env: { NODE_ENV: 'production', ...base },
      accessor: (auth) =>
        auth.loadAuthEnv({
          NODE_ENV: 'production',
          ...base,
          AUTH_PROVIDER: 'jwt',
        } as any),
    }));

  it('requires OAUTH_CLIENT_SECRET when AUTH_PROVIDER=oauth', async () =>
    expectInvalidAuth({
      env: { NODE_ENV: 'production', ...base },
      accessor: (auth) =>
        auth.loadAuthEnv({
          NODE_ENV: 'production',
          ...base,
          AUTH_PROVIDER: 'oauth',
          OAUTH_CLIENT_ID: 'id',
        } as any),
    }));

  it('loads when provider secrets are present', async () =>
    withEnv(
      {
        NODE_ENV: 'production',
        ...base,
        AUTH_PROVIDER: 'oauth',
        OAUTH_ISSUER,
        OAUTH_REDIRECT_ORIGIN,
        OAUTH_CLIENT_ID: 'id',
        OAUTH_CLIENT_SECRET,
        JWT_SECRET,
      } as any,
      async () => {
        const { loadAuthEnv } = await import('../auth.ts');
        const cfg = loadAuthEnv();
        expect(cfg.AUTH_PROVIDER).toBe('oauth');
        expect(cfg.OAUTH_CLIENT_SECRET).toBe(OAUTH_CLIENT_SECRET);
      },
    ));
});

// ------------ cms ------------
describe('cms env', () => {
  const prod = {
    NODE_ENV: 'production',
    CMS_SPACE_URL: 'https://cms.example.com',
    CMS_ACCESS_TOKEN: 'token',
    SANITY_API_VERSION: '2021-10-21',
    SANITY_PROJECT_ID: 'project',
    SANITY_DATASET: 'production',
    SANITY_API_TOKEN: 'apitoken',
    SANITY_PREVIEW_SECRET: 'preview',
    SANITY_BASE_URL: 'https://sanity.example.com/',
    CMS_BASE_URL: 'https://cms.example.com/',
  } as const;

  describe.each([[prod], [{ NODE_ENV: 'development' }]])('cms loader %j', (env) => {
    it('parses values', async () =>
      withEnv(env as any, async () => {
        const mod = await import('../cms.ts');
        expect(mod.cmsEnv.CMS_BASE_URL?.endsWith('/') ?? false).toBe(false);
      }));

    it('throws when CMS_ACCESS_TOKEN is missing', async () => {
      if (env.NODE_ENV !== 'production') return;
      await withEnv({ ...env, CMS_ACCESS_TOKEN: undefined } as any, async () => {
        await expect(import('../cms.ts')).rejects.toThrow('Invalid CMS environment variables');
      });
    });
  });
});

// ------------ core ------------
describe('core env', () => {
  const base = {
    NEXTAUTH_SECRET: NEXT,
    SESSION_SECRET: SESSION,
    CMS_SPACE_URL: 'https://cms.example.com',
    CMS_ACCESS_TOKEN: 'token',
    SANITY_API_VERSION: '2021-10-21',
    SANITY_PROJECT_ID: 'test-project',
    SANITY_DATASET: 'production',
    SANITY_API_TOKEN: 'test-token',
    SANITY_PREVIEW_SECRET: 'preview-secret',
  };
  describe.each([
    [{ NODE_ENV: 'production', CART_COOKIE_SECRET: 'cart', ...base }],
    [{ NODE_ENV: 'development', ...base }],
    [{ NODE_ENV: 'test', ...base }],
  ])('core loader %j', (env) => {
    it('parses', async () =>
      withEnv(env as any, async () => {
        const { loadCoreEnv } = await import('../core.ts');
        const cfg = loadCoreEnv();
        expect(cfg.NEXTAUTH_SECRET).toBeDefined();
      }));

    it('throws on invalid CART_TTL', async () =>
      withEnv({ ...env, CART_TTL: 'oops' } as any, async () => {
        if (env.NODE_ENV === 'production') {
          await expect(import('../core.ts')).rejects.toThrow(
            'Invalid core environment variables',
          );
          return;
        }

        const { loadCoreEnv } = await import('../core.ts');
        expect(() => loadCoreEnv()).toThrow(
          'Invalid core environment variables',
        );
      }));
  });

  it('proxy exposes values', async () =>
    withEnv({ NODE_ENV: 'development', ...base } as any, async () => {
      const { coreEnv } = await import('../core.ts');
      expect('NEXTAUTH_SECRET' in coreEnv).toBe(true);
      expect(Object.keys(coreEnv)).toEqual(expect.arrayContaining(['NEXTAUTH_SECRET']));
      expect(Object.getOwnPropertyDescriptor(coreEnv, 'NEXTAUTH_SECRET')).toBeDefined();
    }));
});

// ------------ email ------------
describe('email env', () => {
  describe.each([
    [
      {
        EMAIL_PROVIDER: 'smtp',
        EMAIL_FROM: 'from@example.com',
        CAMPAIGN_FROM: 'from@example.com',
        SMTP_PORT: '25',
        SMTP_SECURE: 'true',
      },
    ],
    [
      {
        EMAIL_PROVIDER: 'sendgrid',
        EMAIL_FROM: 'from@example.com',
        CAMPAIGN_FROM: 'from@example.com',
        SENDGRID_API_KEY: 'sg',
        SMTP_PORT: '25',
        SMTP_SECURE: 'false',
      },
    ],
    [
      {
        EMAIL_PROVIDER: 'resend',
        EMAIL_FROM: 'from@example.com',
        CAMPAIGN_FROM: 'from@example.com',
        RESEND_API_KEY: 'rk',
        SMTP_PORT: '25',
        SMTP_SECURE: 'no',
      },
    ],
  ])('email loader %j', (env) => {
    it('parses provider settings', async () =>
      withEnv(env as any, async () => {
        const mod = await import('../email.ts');
        expect(mod.emailEnv.EMAIL_PROVIDER).toBe(env.EMAIL_PROVIDER ?? 'smtp');
      }));

    it('throws on invalid SMTP_PORT', async () =>
      withEnv({ ...env, SMTP_PORT: 'oops' } as any, async () => {
        await expect(import('../email.ts')).rejects.toThrow('Invalid email environment variables');
      }));
  });

  it('requires keys for send providers', async () =>
    withEnv(
      {
        EMAIL_PROVIDER: 'sendgrid',
        EMAIL_FROM: 'from@example.com',
        CAMPAIGN_FROM: 'from@example.com',
      } as any,
      async () => {
        await expect(import('../email.ts')).rejects.toThrow('Invalid email environment variables');
      },
    ));

  it('rejects unknown provider', async () =>
    withEnv(
      {
        EMAIL_PROVIDER: 'mailgun',
        EMAIL_FROM: 'from@example.com',
        CAMPAIGN_FROM: 'a@b.com',
      } as any,
      async () => {
        await expect(import('../email.ts')).rejects.toThrow('Invalid email environment variables');
      },
    ));
});

// ------------ payments ------------
describe('payments env', () => {
  describe.each([
    [{ PAYMENTS_GATEWAY: 'disabled' }],
    [{
      PAYMENTS_PROVIDER: 'stripe',
      STRIPE_SECRET_KEY: 'sk',
      STRIPE_WEBHOOK_SECRET: 'wh',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk',
      PAYMENTS_CURRENCY: 'USD',
      PAYMENTS_SANDBOX: 'true',
    }],
  ])('payments loader %j', (env) => {
    it('parses or defaults', async () =>
      withEnv(env as any, async () => {
        const { loadPaymentsEnv } = await import('../payments.ts');
        const cfg = loadPaymentsEnv();
        expect(cfg.PAYMENTS_SANDBOX).toBeDefined();
      }));

    it('falls back on invalid currency', async () =>
      withEnv({ ...env, PAYMENTS_CURRENCY: 'US' } as any, async () => {
        const { loadPaymentsEnv, paymentsEnvSchema } = await import('../payments.ts');
        const cfg = loadPaymentsEnv();
        expect(cfg).toEqual(paymentsEnvSchema.parse({}));
      }));
  });

  it('errors on unsupported provider', async () =>
    withEnv({}, async () => {
      const { loadPaymentsEnv } = await import('../payments.ts');
      expect(() =>
        loadPaymentsEnv({ PAYMENTS_PROVIDER: 'paypal' } as any),
      ).toThrow('Invalid payments environment variables');
    }));

  it('throws when stripe keys missing', async () =>
    withEnv({}, async () => {
      const { loadPaymentsEnv } = await import('../payments.ts');
      expect(() =>
        loadPaymentsEnv({
          PAYMENTS_PROVIDER: 'stripe',
          STRIPE_SECRET_KEY: 'sk',
        } as any),
      ).toThrow('Invalid payments environment variables');
    }));
});

// ------------ shipping ------------
describe('shipping env', () => {
  describe.each([
    [{ SHIPPING_PROVIDER: 'none', ALLOWED_COUNTRIES: '' }],
    [{ SHIPPING_PROVIDER: 'ups', UPS_KEY: 'key', ALLOWED_COUNTRIES: 'US,CA', FREE_SHIPPING_THRESHOLD: '50' }],
  ])('shipping loader %j', (env) => {
    it('parses regions and thresholds', async () =>
      withEnv(env as any, async () => {
        const { loadShippingEnv } = await import('../shipping.ts');
        const cfg = loadShippingEnv();
        if (env.ALLOWED_COUNTRIES) {
          expect(cfg.ALLOWED_COUNTRIES).toEqual(['US', 'CA']);
        } else {
          expect(cfg.ALLOWED_COUNTRIES).toBeUndefined();
        }
      }));

    it('throws on negative FREE_SHIPPING_THRESHOLD', async () =>
      withEnv(env as any, async () => {
        const { loadShippingEnv } = await import('../shipping.ts');
        expect(() =>
          loadShippingEnv({
            ...env,
            FREE_SHIPPING_THRESHOLD: '-1',
          } as any),
        ).toThrow('Invalid shipping environment variables');
      }));
  });

  it('requires carrier keys', async () =>
    withEnv({}, async () => {
      const { loadShippingEnv } = await import('../shipping.ts');
      expect(() =>
        loadShippingEnv({ SHIPPING_PROVIDER: 'ups' } as any),
      ).toThrow('Invalid shipping environment variables');
    }));

  it('throws on invalid parse via eager import', async () => {
    await withEnv({ SHIPPING_PROVIDER: 'dhl' } as any, async () => {
      await expect(import('../shipping.ts')).rejects.toThrow('Invalid shipping environment variables');
    });
  });
});
