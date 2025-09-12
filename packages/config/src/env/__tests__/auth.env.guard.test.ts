/** @jest-environment node */
import { describe, it, expect } from '@jest/globals';
import { withEnv } from './test-helpers';

async function importLoader() {
  return await import('../auth.ts');
}

describe('auth env guards', () => {
  it('throws when NEXTAUTH_SECRET and SESSION_SECRET are missing in production', async () => {
    await withEnv(
      {
        NODE_ENV: 'production',
        NEXTAUTH_SECRET: 'x'.repeat(32),
        SESSION_SECRET: 'y'.repeat(32),
      },
      async () => {
        const { loadAuthEnv } = await importLoader();
        delete process.env.NEXTAUTH_SECRET;
        delete process.env.SESSION_SECRET;
        expect(() => loadAuthEnv()).toThrow('Invalid auth environment variables');
      },
    );
  });

  describe.each(['ALLOW_GUEST', 'ENFORCE_2FA'] as const)('%s boolean parsing', (key) => {
    it.each([
      ['true', true],
      ['false', false],
      ['1', true],
      ['0', false],
    ])('accepts %s', async (raw, expected) => {
      await withEnv({}, async () => {
        const { loadAuthEnv } = await importLoader();
        process.env[key] = raw;
        const env = loadAuthEnv();
        expect(env[key]).toBe(expected);
      });
    });

    it('rejects invalid values', async () => {
      await withEnv({}, async () => {
        const { loadAuthEnv } = await importLoader();
        process.env[key] = '';
        expect(() => loadAuthEnv()).toThrow('Invalid auth environment variables');
      });
    });
  });

  describe('AUTH_TOKEN_TTL normalization', () => {
    const secrets = {
      NEXTAUTH_SECRET: 'a'.repeat(32),
      SESSION_SECRET: 'b'.repeat(32),
    } as const;

    it('falls back to default when blank', async () => {
      await withEnv(
        { NODE_ENV: 'production', ...secrets, AUTH_TOKEN_TTL: '' },
        async () => {
          const { loadAuthEnv } = await importLoader();
          const env = loadAuthEnv();
          expect(env.AUTH_TOKEN_TTL).toBe(900);
        },
      );
    });

    it.each([
      ['60', 60],
      ['5m', 300],
    ])('normalizes %s', async (raw, expected) => {
      await withEnv(
        { NODE_ENV: 'production', ...secrets, AUTH_TOKEN_TTL: raw },
        async () => {
          const { loadAuthEnv } = await importLoader();
          const env = loadAuthEnv();
          expect(env.AUTH_TOKEN_TTL).toBe(expected);
        },
      );
    });
  });
});

