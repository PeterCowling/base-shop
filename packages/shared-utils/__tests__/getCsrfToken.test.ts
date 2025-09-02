import { getCsrfToken } from '../src/getCsrfToken';

describe('getCsrfToken', () => {
  const originalLocation = globalThis.location;

  afterEach(() => {
    document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.head.querySelector('meta[name="csrf-token"]')?.remove();
    jest.restoreAllMocks();
    // clean up any mocked crypto
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).crypto;
    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      configurable: true,
    });
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

  it.each(['http:', 'https:'])('generates and stores token when none exists (protocol %s)', (protocol) => {
    const cookieSpy = jest.spyOn(document, 'cookie', 'set');
    const mockCrypto = { randomUUID: jest.fn().mockReturnValue('generated-token') };
    Object.defineProperty(globalThis, 'crypto', {
      value: mockCrypto,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'location', {
      value: { ...originalLocation, protocol },
      configurable: true,
    });
    const token = getCsrfToken();
    expect(token).toBe('generated-token');
    expect(mockCrypto.randomUUID).toHaveBeenCalled();
    expect(cookieSpy).toHaveBeenCalledWith(
      `csrf_token=generated-token; path=/; SameSite=Strict${protocol === 'https:' ? '; secure' : ''}`
    );
    expect(document.cookie).toBe(protocol === 'https:' ? '' : 'csrf_token=generated-token');
  });

  it('returns undefined when document is undefined', () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'document'
    )!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).document;
    expect(getCsrfToken()).toBeUndefined();
    Object.defineProperty(globalThis, 'document', originalDescriptor);
  });
});
