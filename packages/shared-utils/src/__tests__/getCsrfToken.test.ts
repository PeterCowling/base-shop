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
});

