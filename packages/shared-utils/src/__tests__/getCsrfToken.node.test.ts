/**
 * @jest-environment node
 */
import { getCsrfToken } from '../getCsrfToken';

describe('getCsrfToken on server', () => {
  it('returns undefined when document is not available', () => {
    expect(getCsrfToken()).toBeUndefined();
  });

  it('returns token from x-csrf-token header', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-csrf-token': 'header-token' },
    });
    expect(getCsrfToken(req)).toBe('header-token');
  });

  it('trims whitespace from x-csrf-token header', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-csrf-token': '  spaced-token  ' },
    });
    expect(getCsrfToken(req)).toBe('spaced-token');
  });

  it('returns token from query parameter', () => {
    const req = new Request('https://example.com?csrf_token=query-token');
    expect(getCsrfToken(req)).toBe('query-token');
  });

  it('trims whitespace from query parameter token', () => {
    const req = new Request('https://example.com?csrf_token=%20query-token%20');
    expect(getCsrfToken(req)).toBe('query-token');
  });

  it('returns token from cookie header', () => {
    const req = new Request('https://example.com', {
      headers: { cookie: 'csrf_token=cookie-token' },
    });
    expect(getCsrfToken(req)).toBe('cookie-token');
  });

  it('accepts SimpleReq objects with csrf cookie', () => {
    const req = { headers: { cookie: 'csrf=token' } };
    expect(getCsrfToken(req)).toBe('token');
  });

  it('returns undefined when csrf_token cookie is empty or whitespace', () => {
    const emptyCookieReq = new Request('https://example.com', {
      headers: { cookie: 'csrf_token=' },
    });
    const whitespaceCookieReq = new Request('https://example.com', {
      headers: { cookie: 'csrf_token=   ' },
    });
    expect(getCsrfToken(emptyCookieReq)).toBeUndefined();
    expect(getCsrfToken(whitespaceCookieReq)).toBeUndefined();
  });

  it('query token overrides cookie token', () => {
    const req = new Request('https://example.com?csrf_token=query-token', {
      headers: { cookie: 'csrf_token=cookie-token' },
    });
    expect(getCsrfToken(req)).toBe('query-token');
  });

  it('ignores path-scoped csrf_token cookies', () => {
    const req = new Request('https://example.com', {
      headers: { cookie: 'csrf_token=/foo; csrf_token=cookie-token' },
    });
    expect(getCsrfToken(req)).toBe('cookie-token');
  });

  it('returns undefined when token is missing from Request', () => {
    const req = new Request('https://example.com');
    expect(getCsrfToken(req)).toBeUndefined();
  });

  it('header token overrides cookie and query tokens', () => {
    const req = new Request('https://example.com?csrf_token=query-token', {
      headers: {
        'x-csrf-token': 'header-token',
        cookie: 'csrf_token=cookie-token',
      },
    });
    expect(getCsrfToken(req)).toBe('header-token');
  });
});

