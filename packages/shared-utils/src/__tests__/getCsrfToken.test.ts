/**
 * @jest-environment jsdom
 */
import { getCsrfToken } from '../getCsrfToken';

describe('getCsrfToken', () => {
  const originalCrypto = globalThis.crypto;
  const originalLocation = globalThis.location;

  afterEach(() => {
    document.head.innerHTML = '';
    document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    Object.defineProperty(globalThis, 'crypto', { value: originalCrypto, configurable: true });
    Object.defineProperty(globalThis, 'location', { value: originalLocation, configurable: true });
    jest.restoreAllMocks();
  });

  it('returns token from meta tag when present', () => {
    document.head.innerHTML = '<meta name="csrf-token" content="meta-token">';
    expect(getCsrfToken()).toBe('meta-token');
  });

  it('returns token from cookie when present', () => {
    document.cookie = 'csrf_token=cookie-token';
    expect(getCsrfToken()).toBe('cookie-token');
  });

  it('extracts token from x-csrf-token header', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-csrf-token': 'header-token' },
    });
    expect(getCsrfToken(req)).toBe('header-token');
  });

  it('extracts token from query string', () => {
    const req = new Request('https://example.com?csrf_token=query-token');
    expect(getCsrfToken(req)).toBe('query-token');
  });

  it('extracts token from cookie header', () => {
    const req = new Request('https://example.com', {
      headers: { cookie: 'csrf_token=cookie-header-token' },
    });
    expect(getCsrfToken(req)).toBe('cookie-header-token');
  });

  it('prioritizes meta token over cookie without altering cookie', () => {
    document.head.innerHTML = '<meta name="csrf-token" content="meta-token">';
    document.cookie = 'csrf_token=cookie-token';
    const cookieSpy = jest.spyOn(document, 'cookie', 'set');
    const token = getCsrfToken();
    expect(token).toBe('meta-token');
    expect(cookieSpy).not.toHaveBeenCalled();
    expect(document.cookie).toBe('csrf_token=cookie-token');
  });

  it.each(['http:', 'https:'])(
    'generates and stores token when missing (protocol %s)',
    (protocol) => {
      const cookieSpy = jest.spyOn(document, 'cookie', 'set');
      const mockCrypto = { randomUUID: jest.fn().mockReturnValue('generated-token') };
      Object.defineProperty(globalThis, 'crypto', { value: mockCrypto, configurable: true });
      Object.defineProperty(globalThis, 'location', {
        value: { ...originalLocation, protocol },
        configurable: true,
      });

      const token = getCsrfToken();
      expect(token).toBe('generated-token');
      expect(mockCrypto.randomUUID).toHaveBeenCalled();
      expect(cookieSpy).toHaveBeenCalledWith(
        `csrf_token=generated-token; path=/; SameSite=Strict${
          protocol === 'https:' ? '; secure' : ''
        }`
      );
      expect(document.cookie).toBe(
        protocol === 'https:' ? '' : 'csrf_token=generated-token'
      );
    }
  );

  it('sets secure cookie attribute when protocol is https', () => {
    const cookieSpy = jest.spyOn(document, 'cookie', 'set');
    const mockCrypto = { randomUUID: jest.fn().mockReturnValue('secure-token') };
    Object.defineProperty(globalThis, 'crypto', { value: mockCrypto, configurable: true });
    Object.defineProperty(globalThis, 'location', {
      value: { ...originalLocation, protocol: 'https:' },
      configurable: true,
    });

    const token = getCsrfToken();
    expect(token).toBe('secure-token');
    expect(cookieSpy).toHaveBeenCalledWith(
      'csrf_token=secure-token; path=/; SameSite=Strict; secure'
    );
  });
});

