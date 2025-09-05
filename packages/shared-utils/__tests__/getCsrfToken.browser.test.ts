import { getCsrfToken } from '../src/getCsrfToken';

describe('getCsrfToken in browser', () => {
  afterEach(() => {
    document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.head.innerHTML = '';
    jest.restoreAllMocks();
  });

  it('reads token from meta tag', () => {
    document.head.innerHTML = '<meta name="csrf-token" content="meta-token">';
    expect(getCsrfToken()).toBe('meta-token');
  });

  it('reads token from cookie when meta missing', () => {
    document.cookie = 'csrf_token=cookie-token';
    expect(getCsrfToken()).toBe('cookie-token');
  });

  it('prefers meta tag over cookie', () => {
    document.head.innerHTML = '<meta name="csrf-token" content="meta-token">';
    document.cookie = 'csrf_token=cookie-token';
    expect(getCsrfToken()).toBe('meta-token');
  });

  it('generates token and sets cookie when absent', () => {
    const original = crypto;
    Object.defineProperty(globalThis, 'crypto', {
      value: { ...original, randomUUID: () => 'uuid-123' },
    });
    const token = getCsrfToken();
    expect(token).toBe('uuid-123');
    expect(document.cookie).toContain('csrf_token=uuid-123');
    Object.defineProperty(globalThis, 'crypto', { value: original });
  });
});
