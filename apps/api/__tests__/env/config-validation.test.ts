import { createExpectInvalidAuthEnv } from '../../../../packages/config/test/utils/expectInvalidAuthEnv';

const withEnv = async (
  vars: Record<string, string | undefined>,
  loader: () => Promise<unknown> | unknown,
) => {
  const originalEnv = process.env;
  process.env = { ...originalEnv } as NodeJS.ProcessEnv;
  for (const [key, value] of Object.entries(vars)) {
    if (typeof value === 'undefined') {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  jest.resetModules();
  try {
    return await loader();
  } finally {
    process.env = originalEnv;
  }
};

const expectInvalidAuthEnv = createExpectInvalidAuthEnv(withEnv);

describe('env schema validation in API context', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, EMAIL_FROM: 'from@example.com' } as NodeJS.ProcessEnv;
  });
  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('auth throws when JWT secret missing for jwt provider', async () => {
    await expectInvalidAuthEnv({
      env: {
        NODE_ENV: 'production',
        NEXTAUTH_SECRET: 'x'.repeat(32),
        SESSION_SECRET: 'y'.repeat(32),
        AUTH_PROVIDER: 'jwt',
        JWT_SECRET: undefined,
      },
      accessor: (auth) => auth.loadAuthEnv(),
    });
  });

  it('cms throws when CMS_SPACE_URL missing in production', async () => {
    await expect(
      withEnv(
        {
          NODE_ENV: 'production',
          CMS_SPACE_URL: undefined,
          CMS_ACCESS_TOKEN: 'token',
        },
        () => import('@acme/config/env/cms')
      )
    ).rejects.toThrow('Invalid CMS environment variables');
  });

  it('core import fails when JWT secret missing', async () => {
    await expectInvalidAuthEnv({
      env: {
        NODE_ENV: 'production',
        NEXTAUTH_SECRET: 'x'.repeat(32),
        SESSION_SECRET: 'y'.repeat(32),
        AUTH_PROVIDER: 'jwt',
        JWT_SECRET: undefined,
      },
      accessor: async () => {
        const { loadCoreEnv } = await import('@acme/config/env/core');
        return loadCoreEnv();
      },
      expectedMessage: 'Invalid core environment variables',
    });
  });

  it('requireEnv throws for missing variable', async () => {
    const { requireEnv } = await import('@acme/config/env/core');
    expect(() => requireEnv('MISSING')).toThrow('MISSING is required');
  });

  it('email throws when provider resend without API key', async () => {
    process.env.EMAIL_PROVIDER = 'resend';

    await expect(import('@acme/config/env/email')).rejects.toThrow(
      'Invalid email environment variables'
    );
  });

  it('payments throws when stripe secrets missing', async () => {
    process.env.PAYMENTS_PROVIDER = 'stripe';

    await expect(import('@acme/config/env/payments')).rejects.toThrow(
      'Invalid payments environment variables'
    );
  });

  it('shipping throws when provider ups without key', async () => {
    process.env.SHIPPING_PROVIDER = 'ups';

    await expect(import('@acme/config/env/shipping')).rejects.toThrow(
      'Invalid shipping environment variables'
    );
  });
});
