import { describe, it, expect, jest } from '@jest/globals';
import { withEnv } from './test-helpers';

describe('emailEnv provider selection', () => {
  it.each([
    ['sendgrid', { SENDGRID_API_KEY: 'sg-key' }],
    ['resend', { RESEND_API_KEY: 're-key' }],
  ])('loads %s provider', async (EMAIL_PROVIDER, extra) => {
    await withEnv(
      { EMAIL_PROVIDER, EMAIL_FROM: 'n@x.com', ...extra },
      async () => {
        const { emailEnv } = await import('../email.ts');
        expect(emailEnv.EMAIL_PROVIDER).toBe(EMAIL_PROVIDER);
      },
    );
  });

  it('throws on invalid EMAIL_PROVIDER', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      withEnv(
        { EMAIL_PROVIDER: '???', EMAIL_FROM: 'n@x.com' },
        () => import('../email.ts'),
      ),
    ).rejects.toThrow('Invalid email environment variables');
    expect(errorSpy).toHaveBeenCalledWith(
      '❌ Invalid email environment variables:',
      expect.objectContaining({
        EMAIL_PROVIDER: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });
});
