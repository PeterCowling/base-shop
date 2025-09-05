/**
 * @jest-environment node
 */
import { getCsrfToken } from '../src/getCsrfToken';

describe('getCsrfToken on server', () => {
  it('returns token from x-csrf-token header', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-csrf-token': 'header-token' },
    });
    expect(getCsrfToken(req)).toBe('header-token');
  });

  it('prioritizes header token when query parameter is also present', () => {
    const req = new Request('https://example.com?csrf_token=query-token', {
      headers: { 'x-csrf-token': 'header-token' },
    });
    expect(getCsrfToken(req)).toBe('header-token');
  });

  it('returns token from query string parameter', () => {
    const req = new Request('https://example.com?csrf_token=query-token');
    expect(getCsrfToken(req)).toBe('query-token');
  });

  it('returns token from cookie when header and query missing', () => {
    const req = new Request('https://example.com', {
      headers: { cookie: 'csrf_token=cookie-token; other=1' },
    });
    expect(getCsrfToken(req)).toBe('cookie-token');
  });

  it('prioritizes query parameter over cookie', () => {
    const req = new Request('https://example.com?csrf_token=query-token', {
      headers: { cookie: 'csrf_token=cookie-token' },
    });
    expect(getCsrfToken(req)).toBe('query-token');
  });

  it('prioritizes header over query and cookie', () => {
    const req = new Request('https://example.com?csrf_token=query-token', {
      headers: {
        'x-csrf-token': 'header-token',
        cookie: 'csrf_token=cookie-token',
      },
    });
    expect(getCsrfToken(req)).toBe('header-token');
  });

  it('returns undefined when token missing', () => {
    const req = new Request('https://example.com');
    expect(getCsrfToken(req)).toBeUndefined();
  });
});
