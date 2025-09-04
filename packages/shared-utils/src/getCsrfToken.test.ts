/**
 * @jest-environment node
 */
import { JSDOM } from 'jsdom';
import { getCsrfToken } from './getCsrfToken';

describe('getCsrfToken', () => {
  const originalLocation = globalThis.location;
  const originalCrypto = globalThis.crypto;

  afterEach(() => {
    if (globalThis.document) {
      globalThis.document.head.innerHTML = '';
      globalThis.document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      // @ts-ignore
      delete globalThis.document;
    }
    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      configurable: true,
    });
    jest.restoreAllMocks();
  });

  describe('server request', () => {
    it('returns token from x-csrf-token header', () => {
      const req = new Request('https://example.com', {
        headers: { 'x-csrf-token': 'header-token' },
      });
      expect(getCsrfToken(req)).toBe('header-token');
    });

    it('is case-insensitive for X-CSRF-Token header', () => {
      const req = new Request('https://example.com', {
        headers: { 'X-CsRf-ToKeN': 'mixed-case-token' },
      });
      expect(getCsrfToken(req)).toBe('mixed-case-token');
    });

    it('returns token from cookie when header and query are absent', () => {
      const req = new Request('https://example.com', {
        headers: { cookie: 'csrf_token=cookie-token' },
      });
      expect(getCsrfToken(req)).toBe('cookie-token');
    });

    it('returns token from query parameter', () => {
      const req = new Request('https://example.com?csrf_token=query-token');
      expect(getCsrfToken(req)).toBe('query-token');
    });

    it('query token overrides cookie token', () => {
      const req = new Request('https://example.com?csrf_token=query-token', {
        headers: { cookie: 'csrf_token=cookie-token' },
      });
      expect(getCsrfToken(req)).toBe('query-token');
    });

    it('header token overrides query and cookie tokens', () => {
      const req = new Request('https://example.com?csrf_token=query-token', {
        headers: {
          'x-csrf-token': 'header-token',
          cookie: 'csrf_token=cookie-token',
        },
      });
      expect(getCsrfToken(req)).toBe('header-token');
    });

    it('returns undefined when no token in header, query, or cookie', () => {
      const req = new Request('https://example.com', {
        headers: { cookie: 'foo=bar' },
      });
      expect(getCsrfToken(req)).toBeUndefined();
    });

    it('trims surrounding whitespace from tokens', () => {
      const reqHeader = new Request('https://example.com', {
        headers: { 'x-csrf-token': '  header-token  ' },
      });
      expect(getCsrfToken(reqHeader)).toBe('header-token');

      const reqQuery = new Request(
        'https://example.com?csrf_token=%20query-token%20'
      );
      expect(getCsrfToken(reqQuery)).toBe('query-token');

      const reqCookie = new Request('https://example.com', {
        headers: { cookie: 'csrf_token= cookie-token ' },
      });
      expect(getCsrfToken(reqCookie)).toBe('cookie-token');
    });

    it('treats whitespace-only tokens as missing', () => {
      const req = new Request('https://example.com?csrf_token=%20%20', {
        headers: {
          'x-csrf-token': '   ',
          cookie: 'csrf_token=   ',
        },
      });
      expect(getCsrfToken(req)).toBeUndefined();
    });
  });

  describe('browser', () => {
    it('returns token from meta tag when present', () => {
      const { window } = new JSDOM('<meta name="csrf-token" content="meta-token">');
      globalThis.document = window.document;
      expect(getCsrfToken()).toBe('meta-token');
    });

    it('returns token from cookie when present', () => {
      const { window } = new JSDOM('', { url: 'https://example.com' });
      globalThis.document = window.document;
      Object.defineProperty(globalThis, 'location', {
        value: window.location,
        configurable: true,
      });
      globalThis.document.cookie = 'csrf_token=cookie-token';
      expect(getCsrfToken()).toBe('cookie-token');
    });

    it('generates and stores token when missing', () => {
      const { window } = new JSDOM('', { url: 'https://example.com' });
      globalThis.document = window.document;
      Object.defineProperty(globalThis, 'location', {
        value: window.location,
        configurable: true,
      });
      const mockCrypto = { randomUUID: jest.fn().mockReturnValue('generated-token') };
      Object.defineProperty(globalThis, 'crypto', {
        value: mockCrypto,
        configurable: true,
      });
      const cookieSpy = jest.spyOn(globalThis.document, 'cookie', 'set');
      const token = getCsrfToken();
      expect(token).toBe('generated-token');
      expect(mockCrypto.randomUUID).toHaveBeenCalled();
      expect(cookieSpy).toHaveBeenCalledWith(
        'csrf_token=generated-token; path=/; SameSite=Strict; secure'
      );
    });
  });

  it('returns undefined on server when document is unavailable', () => {
    expect(getCsrfToken()).toBeUndefined();
  });
});

