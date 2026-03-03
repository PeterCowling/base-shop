/**
 * Next.js route handler: GET /g/:token
 *
 * Dev-env mirror of the Cloudflare Pages Function at
 * apps/prime/functions/g/[token].ts
 *
 * Redirects tokenized deep-links to the static /g page with a query param.
 * In staging/production this is handled by the Cloudflare Pages Function.
 */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await params;
  return Response.redirect(
    new URL(`/g?token=${encodeURIComponent(token)}`, _request.url),
    302,
  );
}
