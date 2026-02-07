import jwt from 'jsonwebtoken';
import { vol } from 'memfs';

import { validateShopName } from '@acme/lib';
import { logger } from '@acme/lib/logger';

jest.mock('fs', () => require('memfs').fs);
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
jest.mock('@acme/lib', () => ({ validateShopName: jest.fn((s: string) => s) }));
jest.mock('@acme/lib/context', () => ({
  withRequestContext: (_ctx: unknown, fn: () => unknown) => fn(),
}));

// Import onRequest AFTER mocks are registered so the module loads with mocked dependencies.
const { onRequest } = require('../[shopId]') as typeof import('../[shopId]');

export const verify = jwt.verify as jest.Mock;
export const validate = validateShopName as jest.Mock;

export function setup() {
  vol.reset();
  verify.mockReset();
  validate.mockReset().mockImplementation((s: string) => s);
  delete process.env.UPGRADE_PREVIEW_TOKEN_SECRET;
}

export function createWarnSpy() {
  return jest.spyOn(logger, 'warn').mockImplementation(() => {});
}

export function createContext(
  opts: { shopId?: string; authorization?: string; url?: string } = {},
) {
  const { authorization, url = 'http://localhost' } = opts;
  const params =
    'shopId' in opts
      ? opts.shopId === undefined
        ? ({} as any)
        : { shopId: opts.shopId }
      : { shopId: 'bcd' };
  const headers = authorization ? { authorization } : undefined;
  return {
    params,
    request: new Request(url, headers ? { headers } : undefined),
  };
}

export function createToken(payload: object, secret: string) {
  const { sign } = jest.requireActual('jsonwebtoken');
  return sign(payload, secret, {
    algorithm: 'HS256',
    audience: 'upgrade-preview',
    issuer: 'acme',
    subject: 'shop:bcd:upgrade-preview',
  });
}

export { onRequest, vol };
