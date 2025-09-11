import { getCsrfToken } from '../src/getCsrfToken';

describe('getCsrfToken in browser', () => {
  afterEach(() => {
    document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.head.innerHTML = '';
    jest.restoreAllMocks();
  });

  it('reads token from meta tag', () => {
    document.head.innerHTML = '<meta name="csrf-token" content="abc">';
    expect(getCsrfToken()).toBe('abc');
  });

  it('reads token from cookie when meta missing', () => {
    document.cookie = 'csrf_token=999';
    expect(getCsrfToken()).toBe('999');
  });

  it('prefers meta tag over cookie', () => {
    document.head.innerHTML = '<meta name="csrf-token" content="abc">';
    document.cookie = 'csrf_token=999';
    expect(getCsrfToken()).toBe('abc');
  });

  it('generates token and sets cookie when none present', () => {
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      value: { ...originalCrypto, randomUUID: () => 'generated-uuid' },
      configurable: true,
    });
    const originalLocation = globalThis.location;
    Object.defineProperty(globalThis, 'location', {
      value: new URL('https://example.com'),
      configurable: true,
    });
    const originalCookie = Object.getOwnPropertyDescriptor(
      Document.prototype,
      'cookie'
    )!;
    let cookieValue = '';
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => cookieValue,
      set: (v) => {
        cookieValue = v;
      },
    });

    const token = getCsrfToken();
    expect(token).toBe('generated-uuid');
    expect(cookieValue).toBe(
      'csrf_token=generated-uuid; path=/; SameSite=Strict; secure'
    );

    Object.defineProperty(globalThis, 'crypto', { value: originalCrypto });
    Object.defineProperty(globalThis, 'location', { value: originalLocation });
    Object.defineProperty(document, 'cookie', originalCookie);
  });

  it('generates token without secure flag on http protocol', () => {
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      value: { ...originalCrypto, randomUUID: () => 'generated-uuid' },
      configurable: true,
    });
    const originalLocation = globalThis.location;
    Object.defineProperty(globalThis, 'location', {
      value: { protocol: 'http:' },
      configurable: true,
    });
    const originalCookie = Object.getOwnPropertyDescriptor(
      Document.prototype,
      'cookie',
    )!;
    let cookieValue = '';
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => cookieValue,
      set: (v) => {
        cookieValue = v;
      },
    });

    const token = getCsrfToken();
    expect(token).toBe('generated-uuid');
    expect(cookieValue).toBe(
      'csrf_token=generated-uuid; path=/; SameSite=Strict',
    );

    Object.defineProperty(globalThis, 'crypto', { value: originalCrypto });
    Object.defineProperty(globalThis, 'location', { value: originalLocation });
    Object.defineProperty(document, 'cookie', originalCookie);
  });
});
