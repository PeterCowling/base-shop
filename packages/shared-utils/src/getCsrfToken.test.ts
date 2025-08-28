import { getCsrfToken } from './getCsrfToken';

describe('getCsrfToken', () => {
  afterEach(() => {
    document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    jest.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).crypto;
  });

  it('returns token from cookie when present', () => {
    document.cookie = 'csrf_token=cookie-token';
    expect(getCsrfToken()).toBe('cookie-token');
  });

  it('generates and stores token when cookie missing', () => {
    const mockCrypto = { randomUUID: jest.fn().mockReturnValue('generated-token') };
    Object.defineProperty(globalThis, 'crypto', {
      value: mockCrypto,
      configurable: true,
    });

    const token = getCsrfToken();
    expect(token).toBe('generated-token');
    expect(document.cookie).toContain('csrf_token=generated-token');
    expect(mockCrypto.randomUUID).toHaveBeenCalled();
  });
});
