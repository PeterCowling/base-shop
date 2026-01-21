import { getCsrfToken } from '@acme/lib/security';

describe('getCsrfToken on server', () => {
  it('returns header token', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-csrf-token': 'abc' },
    });
    expect(getCsrfToken(req)).toBe('abc');
  });

  it('returns query token', () => {
    const req = new Request('https://example.com/?csrf_token=xyz');
    expect(getCsrfToken(req)).toBe('xyz');
  });

  it('returns cookie token', () => {
    const req = new Request('https://example.com', {
      headers: { cookie: 'foo=bar; csrf_token=123 ; baz=qux' },
    });
    expect(getCsrfToken(req)).toBe('123');
  });

  it('returns undefined when no token sources exist', () => {
    const req = new Request('https://example.com');
    expect(getCsrfToken(req)).toBeUndefined();
  });

  it('returns undefined without request', () => {
    const originalDocument = globalThis.document;
    const originalRandomUUID = (globalThis.crypto as any).randomUUID;
    // @ts-expect-error simulate server environment without document
    (globalThis as any).document = undefined;
    (globalThis.crypto as any).randomUUID = jest.fn();
    try {
      expect(getCsrfToken()).toBeUndefined();
    } finally {
      globalThis.document = originalDocument;
      if (originalRandomUUID) {
        (globalThis.crypto as any).randomUUID = originalRandomUUID;
      } else {
        delete (globalThis.crypto as any).randomUUID;
      }
    }
  });
});

describe('getCsrfToken in browser', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.cookie
      .split(';')
      .forEach(
        (c) =>
          (document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;'))
      );
  });

  it('returns token from meta tag', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'csrf-token');
    meta.setAttribute('content', 'metaToken');
    document.head.appendChild(meta);
    expect(getCsrfToken()).toBe('metaToken');
  });

  it('generates and stores a token when none present', () => {
    const uuid = 'generated-token';
    const originalRandomUUID = (globalThis.crypto as any).randomUUID;
    (globalThis.crypto as any).randomUUID = jest.fn(() => uuid);
    const token = getCsrfToken();
    expect((globalThis.crypto as any).randomUUID).toHaveBeenCalled();
    expect(token).toBe(uuid);
    expect(document.cookie).toContain(`csrf_token=${uuid}`);
    if (originalRandomUUID) {
      (globalThis.crypto as any).randomUUID = originalRandomUUID;
    } else {
      delete (globalThis.crypto as any).randomUUID;
    }
  });
});
