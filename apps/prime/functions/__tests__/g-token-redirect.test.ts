/**
 * @jest-environment node
 */

import { onRequest } from '../g/[token]';

describe('/g/:token redirect bridge', () => {
  it('TC-01: redirects /g/<token> to /g/?token=<token>', async () => {
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
      if (originalRedirect) {
        responseCtor.redirect = originalRedirect;
      } else {
        delete responseCtor.redirect;
      }
    }
  });
});
