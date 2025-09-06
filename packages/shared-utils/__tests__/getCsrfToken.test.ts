/**
 * @jest-environment node
 */
import { getCsrfToken } from '../src/getCsrfToken';

describe('getCsrfToken on server', () => {
  it('returns token from x-csrf-token header', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-csrf-token': 'abc' },
    });
    expect(getCsrfToken(req)).toBe('abc');
  });

  it('returns token from query string parameter when header missing', () => {
    const req = new Request('https://example.com?csrf_token=123');
    expect(getCsrfToken(req)).toBe('123');
  });

  it('returns token from cookie when header and query missing', () => {
    const req = new Request('https://example.com', {
      headers: { cookie: 'csrf_token=123' },
    });
    expect(getCsrfToken(req)).toBe('123');
  });
});
