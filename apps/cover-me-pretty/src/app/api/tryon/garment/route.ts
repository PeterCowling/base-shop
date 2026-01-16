/* i18n-exempt file -- I18N-123 SSE diagnostics and machine-readable error tokens; UI/localization handled in client try-on controller [ttl=2026-01-31] */
import { NextRequest } from "next/server";
import { z } from "zod";
import { kvGet, kvPut } from "@acme/lib/tryon/kv";

export const runtime = "edge";

const Body = z.object({
  mode: z.literal("garment"),
  productId: z.string(),
  sourceImageUrl: z.string().url(),
  garmentAssets: z.object({
    flatUrl: z.string().url().optional(),
    exemplarUrl: z.string().url().optional(),
  }),
  maskUrl: z.string().url().optional(),
  depthUrl: z.string().url().optional(),
  poseUrl: z.string().url().optional(),
});

type TryonErrorCode =
  | "BAD_REQUEST"
  | "QUOTA_EXCEEDED"
  | "PROVIDER_UNAVAILABLE"
  | "UNKNOWN"
  | "UPSTREAM_TIMEOUT";

function sseLine(line: string): string {
  return line.endsWith("\n") ? line : `${line}\n`;
}

function sseEvent(event: string, data: unknown): string {
  return (
    sseLine(`event: ${event}`) +
    sseLine(`data: ${JSON.stringify(data)}`) +
    "\n"
  ); // extra \n between events
}

function jsonErrorResponse(
  code: TryonErrorCode,
  message: string,
  status: number,
): Response {
  // i18n-exempt -- I18N-123 API error envelope; not rendered directly as UI copy [ttl=2026-01-31]
  return new Response(
    JSON.stringify({ error: { code, message } }),
    {
      status,
      headers: { "content-type": "application/json" },
    },
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  const t0 = Date.now();
  const idem =
    req.headers.get("idempotency-key") ||
    req.headers.get("Idempotency-Key");
  if (!idem) {
    return jsonErrorResponse(
      "BAD_REQUEST",
      "api.tryon.missingIdempotencyKey",
      400,
    );
  }
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      idem,
    );
  if (!isUuid) {
    return jsonErrorResponse(
      "BAD_REQUEST",
      "api.tryon.idempotencyKeyInvalid",
      400,
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonErrorResponse(
      "BAD_REQUEST",
      "api.tryon.invalidJson",
      400,
    );
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return jsonErrorResponse("BAD_REQUEST", parsed.error.message, 400);
  }

  // Idempotency replay (if KV available)
  try {
    const existing = await kvGet(`idem:${idem}`);
    if (existing) {
      const encoder = new TextEncoder();
      const replay = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(sseEvent('ack', { jobId: idem })));
          controller.enqueue(encoder.encode(sseEvent('final', { url: existing, width: 1024, height: 1536 })));
          controller.close();
        }
      });
      return new Response(replay, {
        status: 200,
        headers: {
          // i18n-exempt -- ABC-123 SSE technical headers; not user-facing copy [ttl=2026-01-31]
          'content-type': 'text/event-stream;charset=utf-8',
          'cache-control': 'no-cache,no-transform', // i18n-exempt -- ABC-123 SSE cache header; not user-facing copy [ttl=2026-01-31]
          'x-no-compression': '1',
          'connection': 'keep-alive',
        },
      });
    }
  } catch {}

  const over = checkEnhanceQuota(req);
  if (over) {
    return jsonErrorResponse(
      "QUOTA_EXCEEDED",
      "api.tryon.quotaExceeded",
      429,
    );
  }

  const upstream = process.env.TRYON_HEAVY_API_URL;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      // Ack immediately
      controller.enqueue(encoder.encode(sseEvent('ack', { jobId: idem })));

      if (upstream) {
        // Proxy to upstream SSE if available
        try {
          const res = await fetch(upstream, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idem },
            body: JSON.stringify(parsed.data),
          });
          const ct = res.headers.get('content-type') || '';
          if (!res.ok) {
            controller.enqueue(
              encoder.encode(
                sseEvent("error", {
                  code: "PROVIDER_UNAVAILABLE",
                  message: `Upstream ${res.status}`,
                }),
              ),
            );
            controller.close();
            try { console.log('tryon.garment', { jobId: idem, ms: Date.now()-t0, ok: false, status: res.status }); } catch {}
            return;
          }
          if (ct.includes("text/event-stream") && res.body) {
            const reader = res.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) controller.enqueue(value);
            }
            controller.close();
            try { console.log('tryon.garment', { jobId: idem, ms: Date.now()-t0, ok: true, proxied: true }); } catch {}
            return;
          }
          // Non-SSE: accept JSON final as cache hit
          const json = (await res.json().catch(() => ({}))) as {
            url?: string;
            [key: string]: unknown;
          };
          if (json.url) {
            controller.enqueue(encoder.encode(sseEvent("final", json)));
            try {
              await kvPut(`idem:${idem}`, String(json.url), 86400);
            } catch {}
          } else {
            controller.enqueue(
              encoder.encode(
                sseEvent("error", {
                  code: "UNKNOWN",
                  message: "tryon.providers.garment.unexpectedResponse",
                }),
              ),
            );
          }
          controller.close();
          try { console.log('tryon.garment', { jobId: idem, ms: Date.now()-t0, ok: true, proxied: false }); } catch {}
          return;
        } catch (err) {
          const message =
            err && typeof err === "object" && "message" in err
              ? String((err as { message: unknown }).message)
              : "tryon.providers.garment.upstreamError";
          controller.enqueue(
            encoder.encode(
              sseEvent("error", {
                code: "UPSTREAM_TIMEOUT",
                message,
              }),
            ),
          );
          controller.close();
          try { console.log('tryon.garment', { jobId: idem, ms: Date.now()-t0, ok: false, err: String(err?.message||err) }); } catch {}
          return;
        }
      }

      // Fallback synthesised progress for dev
      controller.enqueue(
        encoder.encode(sseEvent("preprocess", { ok: true })),
      );
      controller.enqueue(
        encoder.encode(sseEvent("compose", { ok: true })),
      );
      for (const p of [0.05, 0.15, 0.3, 0.5, 0.75, 0.9, 1.0]) {
        controller.enqueue(
          encoder.encode(sseEvent("enhance", { progress: p })),
        );
        await new Promise((r) => setTimeout(r, 150));
      }
      const { sourceImageUrl } = parsed.data;
      controller.enqueue(
        encoder.encode(
          sseEvent("final", {
            url: sourceImageUrl,
            width: 1024,
            height: 1536,
            expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
          }),
        ),
      );
      try {
        await kvPut(`idem:${idem}`, String(sourceImageUrl), 86400);
      } catch {}
      controller.close();
      try {
        console.log("tryon.garment", {
          jobId: idem,
          ms: Date.now() - t0,
          ok: true,
          synthetic: true,
        });
      } catch {}
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      // i18n-exempt -- ABC-123 SSE technical headers; not user-facing copy [ttl=2026-01-31]
      'content-type': 'text/event-stream;charset=utf-8',
      'cache-control': 'no-cache,no-transform', // i18n-exempt -- ABC-123 SSE cache header; not user-facing copy [ttl=2026-01-31]
      'x-no-compression': '1',
      'connection': 'keep-alive',
    },
  });
}
// Quota for enhance requests
const ENHANCE_LIMIT = 5;
const enhanceBuckets = new Map<string, { count: number; exp: number }>();
function todayKey(id: string) {
  const d = new Date();
  const day = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
  return `${id}:${day}`;
}
function identity(req: Request): string {
  // Check for user-specific cookie first (most reliable for logged-in users)
  const cookies = req.headers.get("cookie") || "";
  const m = /(?:^|;\s*)tryon\.uid=([^;]+)/.exec(cookies);
  if (m) return decodeURIComponent(m[1]);
  // SECURITY: Prefer verified CDN headers over spoofable x-forwarded-for
  // cf-connecting-ip is set by Cloudflare and cannot be spoofed by clients
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  // Fallback to x-forwarded-for only as last resort (can be spoofed in non-CDN environments)
  const xf = req.headers.get("x-forwarded-for") || "";
  if (xf) return xf.split(",")[0].trim();
  return "anon";
}
function checkEnhanceQuota(req: Request): string | null {
  const id = identity(req);
  const key = todayKey(id);
  const now = Date.now();
  const rec = enhanceBuckets.get(key);
  if (rec && rec.exp > now && rec.count >= ENHANCE_LIMIT) return id;
  const exp = new Date();
  exp.setUTCHours(23, 59, 59, 999);
  if (!rec || rec.exp <= now) {
    enhanceBuckets.set(key, { count: 1, exp: exp.getTime() });
  } else {
    rec.count += 1;
    enhanceBuckets.set(key, rec);
  }
  return null;
}
