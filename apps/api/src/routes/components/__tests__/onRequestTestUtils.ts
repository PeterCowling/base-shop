/* istanbul ignore file */
jest.mock('fs', () => require('memfs').fs);
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
jest.mock('@acme/lib', () => ({ validateShopName: jest.fn((s: string) => s) }));

import path from 'path';
import { vol } from 'memfs';
import jwt from 'jsonwebtoken';
import { validateShopName } from '@acme/lib';
import { onRequest } from '../[shopId]';
import { logger } from '@acme/shared-utils';

export const verify = jwt.verify as jest.Mock;
export const validate = validateShopName as jest.Mock;
export { onRequest, vol };

export const root = path.resolve(__dirname, '../../../../../../..');

export function setup() {
  vol.reset();
  verify.mockReset();
  validate.mockReset().mockImplementation((s: string) => s);
  delete process.env.UPGRADE_PREVIEW_TOKEN_SECRET;
  return jest.spyOn(logger, 'warn').mockImplementation(() => {});
}

export function createRequest({
  shopId,
  token,
  url = 'http://localhost',
  headers = {},
}: {
  shopId?: string;
  token?: string;
  url?: string;
  headers?: Record<string, string>;
} = {}) {
  const params = shopId === undefined ? ({} as any) : { shopId };
  // eslint-disable-next-line security/detect-possible-timing-attacks -- API-4100 test helper input branching
  if (token === '') {
    return {
      params,
      request: {
        headers: { get: () => 'Bearer ' } as any,
        url,
      } as any,
    };
  }
  const allHeaders: Record<string, string> = { ...headers };
  // eslint-disable-next-line security/detect-possible-timing-attacks -- API-4100 test helper input branching
  if (token !== undefined) {
    allHeaders.authorization = `Bearer ${token}`;
  }
  return {
    params,
    request: new Request(url, { headers: allHeaders }),
  } as any;
}
