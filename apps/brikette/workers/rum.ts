// workers/rum.ts
/**
 * Cloudflare Worker: receives JSON POSTs from the RUM reporter
 * and emits a logfmt line that Prometheus (or another scraper)
 * can ingest.
 */

import { z } from "zod";

type Env = {
  RUM_ALLOWED_ORIGINS?: string;
  RUM_MAX_BODY_BYTES?: string;
  RUM_SECRET?: string;
};

// ──────────── Zod schemas ────────────
const vitalName = z.enum(["LCP", "CLS", "INP"]);
const vitalRating = z.enum(["good", "needs-improvement", "poor"]);

const baseMetric = z
  .object({
    name: vitalName,
    value: z.number().finite(),
    id: z.string().optional(),
    delta: z.number().finite().optional(),
    rating: vitalRating,
    navigationType: z.string().optional(),
  })
  .passthrough();

const lcpMetric = baseMetric.extend({
  name: z.literal("LCP"),
  value: z.number().nonnegative().max(120_000), // ms
});
const clsMetric = baseMetric.extend({
  name: z.literal("CLS"),
  value: z.number().nonnegative().max(10), // unitless
});
const inpMetric = baseMetric.extend({
  name: z.literal("INP"),
  value: z.number().nonnegative().max(120_000), // ms
});

const singleMetricSchema = z.discriminatedUnion("name", [lcpMetric, clsMetric, inpMetric]);
const payloadSchema = z.union([singleMetricSchema, z.array(singleMetricSchema)]);

// ──────────── Helpers ────────────
function parseAllowedOrigins(raw: unknown): Set<string> {
  if (!raw || typeof raw !== "string") return new Set();
  return new Set(
    raw
      .split(/[,\s]+/)
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

function getOrigin(req: Request): string | null {
  return req.headers.get("Origin") || req.headers.get("origin");
}

function buildCorsHeaders(origin: string | null, allowed: Set<string>) {
  const headers: Record<string, string> = {
    Vary: "Origin",
  };
  if (origin && allowed.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type, X-RUM-Secret, Authorization";
    headers["Access-Control-Max-Age"] = "600";
  }
  return headers;
}

function unauthorizedResponse(origin: string | null, allowed: Set<string>) {
  return new Response(JSON.stringify({ message: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json", ...buildCorsHeaders(origin, allowed) },
  });
}

function methodNotAllowed(origin: string | null, allowed: Set<string>) {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: buildCorsHeaders(origin, allowed),
  });
}

async function readBodyLimited(req: Request, limitBytes: number): Promise<string> {
  const contentLength = req.headers.get("content-length");
  const parsed = contentLength ? parseInt(contentLength, 10) : Number.NaN;
  if (Number.isFinite(parsed) && parsed > limitBytes) {
    throw new Response(JSON.stringify({ message: "Payload too large" }), {
      status: 413,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!req.body) {
    return "";
  }

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > limitBytes) {
        reader.releaseLock();
        throw new Response(JSON.stringify({ message: "Payload too large" }), {
          status: 413,
          headers: { "Content-Type": "application/json" },
        });
      }
      chunks.push(value);
    }
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(merged);
}

function isAuthorized(req: Request, env: Env, allowed: Set<string>): boolean {
  const origin = getOrigin(req);
  const bearer = req.headers.get("authorization") || req.headers.get("Authorization");
  const headerSecret =
    req.headers.get("x-rum-secret") || (bearer?.startsWith("Bearer ") ? bearer.slice(7) : undefined);
  const envSecret = env.RUM_SECRET;

  // In local/test environments where no policy is configured, allow by default.
  if (!envSecret && allowed.size === 0) return true;

  if (envSecret && headerSecret && headerSecret === envSecret) return true;
  if (origin && allowed.has(origin)) return true;
  return false;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowed = parseAllowedOrigins(env.RUM_ALLOWED_ORIGINS);
    const origin = getOrigin(request);
    const maxBytesRaw = env.RUM_MAX_BODY_BYTES;
    const maxBytesParsed = Number(maxBytesRaw);
    const MAX_BODY_BYTES = Number.isFinite(maxBytesParsed) && maxBytesParsed > 0 ? maxBytesParsed : 8192;

    // Handle CORS preflight first
    if (request.method === "OPTIONS") {
      const headers = buildCorsHeaders(origin, allowed);
      if (headers["Access-Control-Allow-Origin"]) {
        return new Response(null, { status: 204, headers });
      }
      return new Response(null, { status: 204 });
    }

    if (request.method !== "POST") {
      return methodNotAllowed(origin, allowed);
    }

    // Content-Type must be JSON
    const ctype = request.headers.get("content-type") || request.headers.get("Content-Type") || "";
    if (!/application\/json/i.test(ctype)) {
      return new Response(JSON.stringify({ message: "Unsupported Media Type" }), {
        status: 415,
        headers: { "Content-Type": "application/json", ...buildCorsHeaders(origin, allowed) },
      });
    }

    // Auth check: secret header or allowed origin
    if (!isAuthorized(request, env, allowed)) {
      return unauthorizedResponse(origin, allowed);
    }

    let text: string;
    try {
      text = await readBodyLimited(request, MAX_BODY_BYTES);
    } catch (error) {
      if (error instanceof Response) {
        const headers = {
          ...Object.fromEntries(error.headers),
          ...buildCorsHeaders(origin, allowed),
        } as Record<string, string>;
        return new Response(await error.text(), { status: error.status, headers });
      }
      return new Response(JSON.stringify({ message: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...buildCorsHeaders(origin, allowed) },
      });
    }

    let json: unknown;
    try {
      json = JSON.parse(text || "null");
    } catch {
      return new Response(JSON.stringify({ message: "Malformed JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...buildCorsHeaders(origin, allowed) },
      });
    }

    const parsed = payloadSchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ message: "Validation failed", issues: parsed.error.issues }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...buildCorsHeaders(origin, allowed) },
        },
      );
    }

    const metrics = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
    for (const metric of metrics) {
      const nav = metric.navigationType ?? "unknown";
      console.log(
        `metric=web_vital name=${metric.name} value=${metric.value} rating=${metric.rating} nav_type=${nav}${
          metric.id ? ` id=${metric.id}` : ""
        }`,
      );
    }

    return new Response(null, { status: 202, headers: buildCorsHeaders(origin, allowed) });
  },
};
