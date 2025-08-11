import { getCsrfToken } from '../src/getCsrfToken';

describe('getCsrfToken', () => {
  afterEach(() => {
    document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.head.querySelector('meta[name="csrf-token"]')?.remove();
    jest.restoreAllMocks();
    // clean up any mocked crypto
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).crypto;
  });

  it('returns token from meta tag when present', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'csrf-token');
    meta.setAttribute('content', 'meta-token');
    document.head.appendChild(meta);
    expect(getCsrfToken()).toBe('meta-token');
  });

  it('returns token from cookie when meta tag missing', () => {
    document.cookie = 'csrf_token=cookie-token';
    expect(getCsrfToken()).toBe('cookie-token');
  });

  it('generates and stores token when none exists', () => {
    const mockCrypto = { randomUUID: jest.fn().mockReturnValue('generated-token') };
    Object.defineProperty(globalThis, 'crypto', {
      value: mockCrypto,
      configurable: true,
    });
    expect(getCsrfToken()).toBe('generated-token');
    expect(document.cookie).toContain('csrf_token=generated-token');
    expect(mockCrypto.randomUUID).toHaveBeenCalled();
  });
});
