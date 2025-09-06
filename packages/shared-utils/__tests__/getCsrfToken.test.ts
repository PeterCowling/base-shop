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

  it('prioritizes header token when query parameter is also present', () => {
    const req = new Request('https://example.com?csrf_token=123', {
      headers: { 'x-csrf-token': 'abc' },
    });
    expect(getCsrfToken(req)).toBe('abc');
  });

  it('returns token from query string parameter', () => {
    const req = new Request('https://example.com?csrf_token=123');
    expect(getCsrfToken(req)).toBe('123');
  });

  it('returns token from cookie when header and query missing', () => {
    const req = new Request('https://example.com', {
      headers: { cookie: 'session=foo; csrf_token=456' },
    });
    expect(getCsrfToken(req)).toBe('456');
  });

  it('prioritizes query parameter over cookie', () => {
    const req = new Request('https://example.com?csrf_token=123', {
      headers: { cookie: 'csrf_token=456' },
    });
    expect(getCsrfToken(req)).toBe('123');
  });

  it('prioritizes header over query and cookie', () => {
    const req = new Request('https://example.com?csrf_token=123', {
      headers: {
        'x-csrf-token': 'abc',
        cookie: 'csrf_token=456',
      },
    });
    expect(getCsrfToken(req)).toBe('abc');
  });

  it('returns undefined when token missing', () => {
    const req = new Request('https://example.com');
    expect(getCsrfToken(req)).toBeUndefined();
  });
});
