/**
 * CF Pages Function: /csp-report
 *
 * Accepts CSP violation reports from `report-uri` / `report-to` and returns
 * a no-content response. We intentionally avoid logging request payloads.
 */

const CSP_REPORT_CONTENT_TYPES = new Set([
  "application/csp-report",
  "application/reports+json",
  "application/json",
]);

function contentTypeOf(request: Request): string {
  return (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
}

function noContent() {
  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export const onRequestPost = async ({ request }: { request: Request }) => {
  const contentType = contentTypeOf(request);
  if (contentType && !CSP_REPORT_CONTENT_TYPES.has(contentType)) {
    return new Response(
      "Unsupported Media Type", // i18n-exempt -- XA-0101 [ttl=2026-12-31] protocol status text
      { status: 415 },
    );
  }

  // Drain the body so the platform can complete request handling cleanly.
  await request.arrayBuffer().catch(() => new ArrayBuffer(0));
  return noContent();
};

export const onRequestOptions = async () =>
  new Response(null, {
    status: 204,
    headers: {
      Allow: "POST, OPTIONS", // i18n-exempt -- XA-0101 [ttl=2026-12-31] protocol header value
      "Cache-Control": "no-store",
    },
  });

export const onRequest = async () =>
  new Response(
    "Method Not Allowed", // i18n-exempt -- XA-0101 [ttl=2026-12-31] protocol status text
    {
      status: 405,
      headers: {
        Allow: "POST, OPTIONS", // i18n-exempt -- XA-0101 [ttl=2026-12-31] protocol header value
        "Cache-Control": "no-store",
      },
    },
  );
