/* i18n-exempt file -- PP-1100 internal pipeline API helpers [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/_lib/response.ts

type ErrorDetails = Record<string, unknown> | undefined;

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(
  status: number,
  error: string,
  details?: ErrorDetails,
): Response {
  return jsonResponse(
    {
      ok: false,
      error,
      ...(details ? { details } : {}),
    },
    status,
  );
}
