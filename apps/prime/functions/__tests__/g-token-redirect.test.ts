/**
 * @jest-environment node
 */

import { onRequest } from '../g/[token]';

describe('/g/:token redirect bridge', () => {
  function mockRedirect() {
    const responseCtor = Response as unknown as {
      redirect?: (url: string, status?: number) => Response;
    };
    const originalRedirect = responseCtor.redirect;
    responseCtor.redirect = (url: string, status = 302) =>
      new Response(null, {
        status,
        headers: {
          Location: url,
        },
      });
    return () => {
      if (originalRedirect) {
        responseCtor.redirect = originalRedirect;
      } else {
        delete responseCtor.redirect;
      }
    };
  }

  it('TC-01: redirects /g/<token> to /g/?token=<token> with 302', async () => {
    const restore = mockRedirect();
    const token = 'e2e-token-bridge';
    const request = new Request(`https://prime.example.com/g/${token}`);

    try {
      const response = await onRequest({
        params: { token },
        request,
      } as unknown as Parameters<typeof onRequest>[0]);

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe(
        `https://prime.example.com/g/?token=${token}`,
      );
    } finally {
      restore();
    }
  });

  it('TC-01b: handles token with trailing slash', async () => {
    const restore = mockRedirect();
    const token = 'token-with-trailing';
    const request = new Request(`https://prime.example.com/g/${token}/`);

    try {
      const response = await onRequest({
        params: { token },
        request,
      } as unknown as Parameters<typeof onRequest>[0]);

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe(
        `https://prime.example.com/g/?token=${token}`,
      );
    } finally {
      restore();
    }
  });

  it('TC-01c: preserves original protocol and host', async () => {
    const restore = mockRedirect();
    const token = 'prod-token';
    const request = new Request(`https://prime.production.com/g/${token}`);

    try {
      const response = await onRequest({
        params: { token },
        request,
      } as unknown as Parameters<typeof onRequest>[0]);

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe(
        `https://prime.production.com/g/?token=${token}`,
      );
    } finally {
      restore();
    }
  });

  it('TC-01d: handles tokens with special characters (URL-safe)', async () => {
    const restore = mockRedirect();
    const token = 'abc-123_XYZ.token';
    const request = new Request(`https://prime.example.com/g/${token}`);

    try {
      const response = await onRequest({
        params: { token },
        request,
      } as unknown as Parameters<typeof onRequest>[0]);

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe(
        `https://prime.example.com/g/?token=${token}`,
      );
    } finally {
      restore();
    }
  });

  it('TC-01e: handles very long tokens', async () => {
    const restore = mockRedirect();
    const token = 'a'.repeat(256);
    const request = new Request(`https://prime.example.com/g/${token}`);

    try {
      const response = await onRequest({
        params: { token },
        request,
      } as unknown as Parameters<typeof onRequest>[0]);

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe(
        `https://prime.example.com/g/?token=${token}`,
      );
    } finally {
      restore();
    }
  });
});
