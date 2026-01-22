export interface Env {
  SUBMISSIONS_BUCKET: R2Bucket;
  UPLOAD_TOKEN_SECRET?: string;
  R2_PREFIX?: string;
  MAX_BYTES?: string;
}

type VerifiedToken = {
  iat: number;
  exp: number;
  nonce: string;
};

const TOKEN_VERSION = "v1";
const DEFAULT_PREFIX = "submissions/";
const DEFAULT_MAX_BYTES = 250 * 1024 * 1024;

function json(data: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  const headers = new Headers(extraHeaders);
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(data), { status, headers });
}

function withCors(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "PUT, OPTIONS");
  // i18n-exempt -- ABC-123 [ttl=2026-01-31] protocol header value
  headers.set("Access-Control-Allow-Headers", "Content-Type, X-XA-Submission-Id");
  headers.set("Access-Control-Max-Age", "86400");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function normalizePrefix(prefix: string): string {
  const trimmed = prefix.trim();
  const withoutLeading = trimmed.replace(/^\/+/, "");
  const withoutTrailing = withoutLeading.replace(/\/+$/, "");
  return withoutTrailing ? `${withoutTrailing}/` : "";
}

// i18n-exempt -- ABC-123 [ttl=2026-01-31] base64 alphabet constant
const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function toBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const triple = (a << 16) | (b << 8) | c;
    out += BASE64_ALPHABET[(triple >> 18) & 63] ?? "";
    out += BASE64_ALPHABET[(triple >> 12) & 63] ?? "";
    out += i + 1 < bytes.length ? BASE64_ALPHABET[(triple >> 6) & 63] ?? "" : "=";
    out += i + 2 < bytes.length ? BASE64_ALPHABET[triple & 63] ?? "" : "=";
  }
  return out;
}

function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function hmacSha256Base64Url(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return toBase64Url(new Uint8Array(sig));
}

async function verifyUploadToken(token: string, secret: string): Promise<VerifiedToken> {
  const parts = token.split(".");
  if (parts.length !== 5) throw new Error("invalid_token");
  const [version, iatRaw, expRaw, nonce, signature] = parts;
  if (version !== TOKEN_VERSION) throw new Error("invalid_token");

  const iat = Number(iatRaw);
  const exp = Number(expRaw);
  if (!Number.isFinite(iat) || !Number.isFinite(exp)) throw new Error("invalid_token");
  if (!nonce || nonce.length > 128) throw new Error("invalid_token");

  const now = Math.floor(Date.now() / 1000);
  if (now > exp) throw new Error("expired");
  if (iat > exp || iat < now - 60 * 60 * 24) throw new Error("expired");

  const payload = `${TOKEN_VERSION}.${iatRaw}.${expRaw}.${nonce}`;
  const expected = await hmacSha256Base64Url(secret, payload);
  if (!constantTimeEqual(signature, expected)) throw new Error("invalid_token");

  return { iat, exp, nonce };
}

function limitBytesStream(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
): ReadableStream<Uint8Array> {
  let total = 0;
  return stream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        total += chunk.byteLength;
        if (total > maxBytes) {
          throw new Error("too_large");
        }
        controller.enqueue(chunk);
      },
    }),
  );
}

function submissionKeyFor(prefix: string, iat: number, nonce: string): string {
  const date = new Date(iat * 1000).toISOString().slice(0, 10);
  const safePrefix = normalizePrefix(prefix || DEFAULT_PREFIX);
  return `${safePrefix}${date}/incoming.${nonce}.zip`;
}

function getUploadTokenSecret(env: Env): string | null {
  const secret = typeof env.UPLOAD_TOKEN_SECRET === "string" ? env.UPLOAD_TOKEN_SECRET : "";
  return secret && secret.length >= 32 ? secret : null;
}

function getMaxBytes(env: Env): number {
  const raw = typeof env.MAX_BYTES === "string" ? Number(env.MAX_BYTES) : NaN;
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX_BYTES;
}

function isContentLengthOverLimit(headers: Headers, maxBytes: number): boolean {
  const contentLengthRaw = headers.get("content-length");
  if (!contentLengthRaw) return false;
  const size = Number(contentLengthRaw);
  return Number.isFinite(size) && size > maxBytes;
}

function getSafeSubmissionId(headers: Headers): string | undefined {
  const raw = headers.get("x-xa-submission-id") || "";
  const submissionId = raw.trim();
  return submissionId && /^[a-zA-Z0-9_-]{8,128}$/.test(submissionId) ? submissionId : undefined;
}

async function resolveUploadBody(
  request: Request,
  maxBytes: number,
): Promise<ReadableStream<Uint8Array> | ArrayBuffer | Response> {
  if (!request.body) {
    return json({ ok: false }, 400);
  }

  const hasWebStream =
    typeof (request.body as unknown as { pipeThrough?: unknown })?.pipeThrough === "function";

  if (hasWebStream) {
    return limitBytesStream(request.body, maxBytes);
  }

  try {
    const buffer = await request.arrayBuffer();
    if (buffer.byteLength > maxBytes) {
      return json({ ok: false }, 413);
    }
    return buffer;
  } catch {
    return json({ ok: false }, 400);
  }
}

async function handleUpload(request: Request, env: Env, token: string): Promise<Response> {
  const secret = getUploadTokenSecret(env);
  if (!secret) {
    return json({ ok: false }, 503);
  }

  let verified: VerifiedToken;
  try {
    verified = await verifyUploadToken(token, secret);
  } catch (err) {
    const code = err instanceof Error ? err.message : "invalid_token";
    if (code === "expired") return json({ ok: false }, 410);
    return json({ ok: false }, 401);
  }

  const maxBytes = getMaxBytes(env);
  if (isContentLengthOverLimit(request.headers, maxBytes)) return json({ ok: false }, 413);

  const objectKey = submissionKeyFor(env.R2_PREFIX || DEFAULT_PREFIX, verified.iat, verified.nonce);

  const safeSubmissionId = getSafeSubmissionId(request.headers);

  const existing = await env.SUBMISSIONS_BUCKET.head(objectKey);
  if (existing) {
    return json({ ok: false }, 409);
  }

  const contentType = request.headers.get("content-type") || "application/zip";
  const uploadBodyOrResponse = await resolveUploadBody(request, maxBytes);
  if (uploadBodyOrResponse instanceof Response) return uploadBodyOrResponse;

  try {
    await env.SUBMISSIONS_BUCKET.put(objectKey, uploadBodyOrResponse, {
      httpMetadata: { contentType },
      customMetadata: {
        tokenVersion: TOKEN_VERSION,
        issuedAt: String(verified.iat),
        ...(safeSubmissionId ? { submissionId: safeSubmissionId } : {}),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "too_large") return json({ ok: false }, 413);
    return json({ ok: false }, 502);
  }

  return json({ ok: true }, 201);
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return withCors(request, json({ ok: true }));
    }

    const segments = url.pathname.split("/").filter(Boolean);
    const isUpload = segments.length === 2 && segments[0] === "upload";

    if (request.method === "OPTIONS" && isUpload) {
      return withCors(request, new Response(null, { status: 204 }));
    }

    if (request.method === "PUT" && isUpload) {
      const token = decodeURIComponent(segments[1] ?? "");
      return withCors(request, await handleUpload(request, env, token));
    }

    return withCors(request, json({ ok: false }, 404));
  },
};

export default worker;
