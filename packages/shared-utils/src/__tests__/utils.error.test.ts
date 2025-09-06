/**
 * @jest-environment node
 */
import { parseJsonBody } from '../parseJsonBody';
import { getCsrfToken } from '../getCsrfToken';
import { z } from 'zod';

describe('parseJsonBody error handling', () => {
  const schema = z.object({ foo: z.string() });

  it('returns 400 for invalid JSON', async () => {
    const req = {
      headers: new Headers({ 'content-type': 'application/json' }),
      text: jest.fn().mockResolvedValue('{invalid'),
    } as unknown as Request;

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const result = await parseJsonBody(req, schema, '10kb');
    consoleSpy.mockRestore();

    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      error: 'Invalid JSON',
    });
  });
});

describe('getCsrfToken error scenarios', () => {
  it('returns undefined when headers and cookies are missing', () => {
    const req = {
      headers: new Headers(),
      url: 'https://example.com/',
    } as unknown as Request;
    expect(getCsrfToken(req)).toBeUndefined();
  });

  it('returns undefined for malformed csrf_token cookie', () => {
    const req1 = {
      headers: new Headers({ cookie: 'csrf_token' }),
      url: 'https://example.com/',
    } as unknown as Request;
    const req2 = {
      headers: new Headers({ cookie: 'csrf_token=' }),
      url: 'https://example.com/',
    } as unknown as Request;

    expect(getCsrfToken(req1)).toBeUndefined();
    expect(getCsrfToken(req2)).toBeUndefined();
  });
});
