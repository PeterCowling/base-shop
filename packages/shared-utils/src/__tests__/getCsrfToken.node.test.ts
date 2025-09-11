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

  it('returns token from query parameter', () => {
    const req = new Request('https://example.com?csrf_token=query-token');
    expect(getCsrfToken(req)).toBe('query-token');
  });

  it('returns token from cookie header', () => {
    const req = new Request('https://example.com', {
      headers: { cookie: 'csrf_token=cookie-token' },
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

