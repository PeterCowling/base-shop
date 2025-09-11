describe('env schema validation in API context', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, EMAIL_FROM: "from@example.com" } as NodeJS.ProcessEnv;
  });
  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('auth throws when JWT secret missing for jwt provider', async () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXTAUTH_SECRET = 'x'.repeat(32);
    process.env.SESSION_SECRET = 'y'.repeat(32);
    process.env.AUTH_PROVIDER = 'jwt';

    await expect(import('@acme/config/env/auth')).rejects.toThrow(
      'Invalid auth environment variables'
    );
  });

  it('cms throws when CMS_SPACE_URL missing in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CMS_ACCESS_TOKEN = 'token';

    await expect(import('@acme/config/env/cms')).rejects.toThrow(
      'Invalid CMS environment variables'
    );
  });

  it('core import fails when JWT secret missing', async () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXTAUTH_SECRET = 'x'.repeat(32);
    process.env.SESSION_SECRET = 'y'.repeat(32);
    process.env.AUTH_PROVIDER = 'jwt';

    await expect(import('@acme/config/env/core')).rejects.toThrow(
      'Invalid auth environment variables'
    );
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
