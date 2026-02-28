export interface Env {
  SUBMISSIONS_BUCKET: R2Bucket;
  CATALOG_BUCKET?: R2Bucket;
  UPLOAD_TOKEN_SECRET?: string;
  CATALOG_WRITE_TOKEN?: string;
  CATALOG_READ_TOKEN?: string;
  R2_PREFIX?: string;
  CATALOG_PREFIX?: string;
  MAX_BYTES?: string;
  CATALOG_MAX_BYTES?: string;
  UPLOAD_ALLOWED_ORIGINS?: string;
}

type VerifiedToken = {
  iat: number;
  exp: number;
  nonce: string;
};

type CatalogPayload = {
  storefront?: string;
  version?: string;
  publishedAt?: string;
  catalog?: unknown;
  mediaIndex?: unknown;
};

const TOKEN_VERSION = "v1";
const DEFAULT_PREFIX = "submissions/";
const DEFAULT_CATALOG_PREFIX = "catalog/";
const DEFAULT_MAX_BYTES = 250 * 1024 * 1024;
const DEFAULT_CATALOG_MAX_BYTES = 10 * 1024 * 1024;
// i18n-exempt -- ABC-123 [ttl=2026-12-31]
const DEFAULT_CATALOG_CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300";
// i18n-exempt -- ABC-123 [ttl=2026-12-31]
const CORS_ALLOWED_HEADERS = "Content-Type, X-XA-Submission-Id, X-XA-Upload-Token, X-XA-Catalog-Token, Authorization";
// i18n-exempt -- ABC-123 [ttl=2026-12-31]
const CORS_ALLOWED_METHODS = "GET, PUT, OPTIONS";

function json(data: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  const headers = new Headers(extraHeaders);
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(data), { status, headers });
}

function parseAllowedOrigins(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      try {
        return new URL(entry).origin;
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}

function resolveAllowedCorsOrigin(request: Request, env: Env): string | null {
  const requestOrigin = request.headers.get("origin");
  if (!requestOrigin) return null;

  let normalizedOrigin: string;
  try {
    normalizedOrigin = new URL(requestOrigin).origin;
  } catch {
    return null;
  }

  const allowedOrigins = parseAllowedOrigins(env.UPLOAD_ALLOWED_ORIGINS);
  if (!allowedOrigins.length) return null;
  return allowedOrigins.includes(normalizedOrigin) ? normalizedOrigin : null;
}

function withCors(
  request: Request,
  response: Response,
  allowedOrigin: string | null,
): Response {
  const headers = new Headers(response.headers);
  if (allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
    headers.set("Vary", "Origin");
    headers.set("Access-Control-Allow-Methods", CORS_ALLOWED_METHODS);
    headers.set("Access-Control-Allow-Headers", CORS_ALLOWED_HEADERS);
    headers.set("Access-Control-Max-Age", "86400");
  }
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

// i18n-exempt -- ABC-123 [ttl=2026-12-31]
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

function resolveMaxBytes(env: Env): number {
  const raw = typeof env.MAX_BYTES === "string" ? Number(env.MAX_BYTES) : NaN;
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX_BYTES;
}

function resolveCatalogMaxBytes(env: Env): number {
  const raw = typeof env.CATALOG_MAX_BYTES === "string" ? Number(env.CATALOG_MAX_BYTES) : NaN;
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_CATALOG_MAX_BYTES;
}

function validateContentLength(headers: Headers, maxBytes: number): Response | null {
  const contentLengthRaw = headers.get("content-length");
  if (!contentLengthRaw) return null;
  const size = Number(contentLengthRaw);
  if (!Number.isFinite(size)) return null;
  return size > maxBytes ? json({ ok: false }, 413) : null;
}

function safeSubmissionIdFrom(headers: Headers): string | undefined {
  const submissionIdRaw = headers.get("x-xa-submission-id") || "";
  const submissionId = submissionIdRaw.trim();
  return submissionId && /^[a-zA-Z0-9_-]{8,128}$/.test(submissionId) ? submissionId : undefined;
}

function decodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function bearerTokenFrom(header: string | null): string {
  if (!header) return "";
  const [scheme, ...rest] = header.trim().split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== "bearer") return "";
  return rest.join(" ").trim();
}

function resolveUploadToken(request: Request, url: URL, pathToken: string): string {
  const headerToken = request.headers.get("x-xa-upload-token")?.trim();
  if (headerToken) return headerToken;

  const authToken = bearerTokenFrom(request.headers.get("authorization"));
  if (authToken) return authToken;

  const queryToken = url.searchParams.get("token")?.trim();
  if (queryToken) return queryToken;

  const decodedPathToken = decodePathSegment(pathToken).trim();
  return decodedPathToken;
}

function resolveCatalogToken(request: Request, url: URL): string {
  const headerToken = request.headers.get("x-xa-catalog-token")?.trim();
  if (headerToken) return headerToken;

  const authToken = bearerTokenFrom(request.headers.get("authorization"));
  if (authToken) return authToken;

  const queryToken = url.searchParams.get("token")?.trim();
  if (queryToken) return queryToken;

  return "";
}

function resolveCatalogBucket(env: Env): R2Bucket {
  return env.CATALOG_BUCKET ?? env.SUBMISSIONS_BUCKET;
}

function resolveCatalogPrefix(env: Env): string {
  return normalizePrefix(env.CATALOG_PREFIX || DEFAULT_CATALOG_PREFIX);
}

function isValidStorefront(value: string): boolean {
  if (value.length < 1 || value.length > 32) return false;
  if (value[0] === "-" || value[value.length - 1] === "-") return false;
  for (const char of value) {
    const isDigit = char >= "0" && char <= "9";
    const isLowerAlpha = char >= "a" && char <= "z";
    if (!isDigit && !isLowerAlpha && char !== "-") return false;
  }
  return true;
}

function parseStorefront(pathSegment: string): string | null {
  const decoded = decodePathSegment(pathSegment).trim().toLowerCase();
  if (!decoded) return null;
  return isValidStorefront(decoded) ? decoded : null;
}

function sanitizeVersion(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || `${Date.now()}`;
}

function latestCatalogKey(prefix: string, storefront: string): string {
  return `${prefix}${storefront}/latest.json`;
}

function versionedCatalogKey(prefix: string, storefront: string, version: string): string {
  return `${prefix}${storefront}/versions/${sanitizeVersion(version)}.json`;
}

function normalizeEtag(raw: string | null): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";
  return trimmed.startsWith("\"") ? trimmed : `"${trimmed}"`;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function verifyTokenOrRespond(token: string, secret: string): Promise<VerifiedToken | Response> {
  try {
    return await verifyUploadToken(token, secret);
  } catch (err) {
    const code = err instanceof Error ? err.message : "invalid_token";
    if (code === "expired") return json({ ok: false }, 410);
    return json({ ok: false }, 401);
  }
}

async function readUploadBody(
  request: Request,
  maxBytes: number,
): Promise<ReadableStream<Uint8Array> | ArrayBuffer | Response> {
  if (!request.body) return json({ ok: false }, 400);

  const hasWebStream =
    typeof (request.body as unknown as { pipeThrough?: unknown })?.pipeThrough === "function";
  if (hasWebStream) {
    return limitBytesStream(request.body, maxBytes);
  }

  let uploadBody: ArrayBuffer;
  try {
    uploadBody = await request.arrayBuffer();
  } catch {
    return json({ ok: false }, 400);
  }
  return uploadBody.byteLength > maxBytes ? json({ ok: false }, 413) : uploadBody;
}

async function handleUpload(request: Request, env: Env, token: string): Promise<Response> {
  const secret = typeof env.UPLOAD_TOKEN_SECRET === "string" ? env.UPLOAD_TOKEN_SECRET : "";
  if (!secret || secret.length < 32) {
    return json({ ok: false }, 503);
  }

  const verified = await verifyTokenOrRespond(token, secret);
  if (verified instanceof Response) return verified;

  const maxBytes = resolveMaxBytes(env);
  const lengthError = validateContentLength(request.headers, maxBytes);
  if (lengthError) return lengthError;

  const objectKey = submissionKeyFor(env.R2_PREFIX || DEFAULT_PREFIX, verified.iat, verified.nonce);
  const safeSubmissionId = safeSubmissionIdFrom(request.headers);

  const uploadBodyOrError = await readUploadBody(request, maxBytes);
  if (uploadBodyOrError instanceof Response) return uploadBodyOrError;

  const contentType = request.headers.get("content-type") || "application/zip";
  const uploadBody = uploadBodyOrError;

  try {
    const stored = await env.SUBMISSIONS_BUCKET.put(objectKey, uploadBody, {
      onlyIf: new Headers({ "If-None-Match": "*" }),
      httpMetadata: { contentType },
      customMetadata: {
        tokenVersion: TOKEN_VERSION,
        issuedAt: String(verified.iat),
        ...(safeSubmissionId ? { submissionId: safeSubmissionId } : {}),
      },
    });
    if (!stored) return json({ ok: false }, 409);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "too_large") return json({ ok: false }, 413);
    if (message.toLowerCase().includes("precondition")) return json({ ok: false }, 409);
    return json({ ok: false }, 502);
  }

  return json({ ok: true }, 201);
}

async function parseCatalogPublishPayload(
  request: Request,
  maxBytes: number,
): Promise<CatalogPayload | Response> {
  const lengthError = validateContentLength(request.headers, maxBytes);
  if (lengthError) return lengthError;

  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return json({ ok: false }, 400);
  }

  if (!raw.trim()) return json({ ok: false }, 400);
  const bytes = new TextEncoder().encode(raw).byteLength;
  if (bytes > maxBytes) return json({ ok: false }, 413);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return json({ ok: false }, 400);
  }

  if (!isObjectRecord(parsed)) return json({ ok: false }, 400);
  return parsed as CatalogPayload;
}

async function handleCatalogPublish(
  request: Request,
  env: Env,
  url: URL,
  storefront: string,
): Promise<Response> {
  const expectedToken = (env.CATALOG_WRITE_TOKEN ?? "").trim();
  if (!expectedToken || expectedToken.length < 16) {
    return json({ ok: false }, 503);
  }

  const providedToken = resolveCatalogToken(request, url);
  if (!providedToken || !constantTimeEqual(providedToken, expectedToken)) {
    return json({ ok: false }, 401);
  }

  const payloadOrError = await parseCatalogPublishPayload(request, resolveCatalogMaxBytes(env));
  if (payloadOrError instanceof Response) return payloadOrError;
  const payload = payloadOrError;

  if (payload.storefront && payload.storefront !== storefront) {
    return json({ ok: false }, 400);
  }
  if (!isObjectRecord(payload.catalog) || !isObjectRecord(payload.mediaIndex)) {
    return json({ ok: false }, 400);
  }

  const publishedAt = new Date().toISOString();
  const requestedVersion = typeof payload.version === "string" ? payload.version : "";
  const version = requestedVersion.trim() || `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const record = {
    ok: true,
    storefront,
    version,
    publishedAt,
    catalog: payload.catalog,
    mediaIndex: payload.mediaIndex,
  };
  const serialized = `${JSON.stringify(record)}\n`;

  const bucket = resolveCatalogBucket(env);
  const prefix = resolveCatalogPrefix(env);
  const latestKey = latestCatalogKey(prefix, storefront);
  const snapshotKey = versionedCatalogKey(prefix, storefront, version);

  try {
    await bucket.put(snapshotKey, serialized, {
      httpMetadata: { contentType: "application/json" },
      customMetadata: {
        storefront,
        version,
        publishedAt,
      },
    });
    await bucket.put(latestKey, serialized, {
      httpMetadata: { contentType: "application/json" },
      customMetadata: {
        storefront,
        version,
        publishedAt,
        snapshotKey,
      },
    });
  } catch {
    return json({ ok: false }, 502);
  }

  return json(
    {
      ok: true,
      storefront,
      version,
      publishedAt,
      key: latestKey,
      snapshotKey,
    },
    201,
  );
}

async function handleCatalogRead(
  request: Request,
  env: Env,
  url: URL,
  storefront: string,
): Promise<Response> {
  const expectedReadToken = (env.CATALOG_READ_TOKEN ?? "").trim();
  if (expectedReadToken) {
    const provided = resolveCatalogToken(request, url);
    if (!provided || !constantTimeEqual(provided, expectedReadToken)) {
      return json({ ok: false }, 401);
    }
  }

  const bucket = resolveCatalogBucket(env);
  const prefix = resolveCatalogPrefix(env);
  const key = latestCatalogKey(prefix, storefront);
  const object = await bucket.get(key);
  if (!object) return json({ ok: false }, 404);

  const etag = normalizeEtag((object as unknown as { httpEtag?: string }).httpEtag ?? "");
  const ifNoneMatch = (request.headers.get("if-none-match") ?? "").trim();
  if (etag && ifNoneMatch === etag) {
    const notModifiedHeaders = new Headers({ "Cache-Control": DEFAULT_CATALOG_CACHE_CONTROL });
    notModifiedHeaders.set("ETag", etag);
    return new Response(null, { status: 304, headers: notModifiedHeaders });
  }

  const body = await object.text();
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": DEFAULT_CATALOG_CACHE_CONTROL,
  });
  if (etag) headers.set("ETag", etag);
  return new Response(body, { status: 200, headers });
}

type RouteMatch =
  | { kind: "upload"; pathToken: string }
  | { kind: "catalog"; storefront: string | null }
  | { kind: "other" };

function matchRoute(pathname: string): RouteMatch {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 1 && segments.length <= 2 && segments[0] === "upload") {
    return {
      kind: "upload",
      pathToken: segments.length === 2 ? (segments[1] ?? "") : "",
    };
  }
  if (segments.length === 2 && segments[0] === "catalog") {
    return {
      kind: "catalog",
      storefront: parseStorefront(segments[1] ?? ""),
    };
  }
  return { kind: "other" };
}

function isCorsDenied(requestHasOrigin: boolean, allowedCorsOrigin: string | null): boolean {
  return requestHasOrigin && !allowedCorsOrigin;
}

async function routeRequest(params: {
  request: Request;
  env: Env;
  url: URL;
  requestHasOrigin: boolean;
  allowedCorsOrigin: string | null;
}): Promise<Response> {
  const { request, env, url, requestHasOrigin, allowedCorsOrigin } = params;

  if (request.method === "GET" && url.pathname === "/health") {
    return json({ ok: true });
  }

  const route = matchRoute(url.pathname);

  if (request.method === "OPTIONS") {
    if (route.kind === "upload" || route.kind === "catalog") {
      if (isCorsDenied(requestHasOrigin, allowedCorsOrigin)) {
        return json({ ok: false }, 403);
      }
      return new Response(null, { status: 204 });
    }
    return json({ ok: false }, 404);
  }

  if (route.kind === "upload") {
    if (request.method !== "PUT") return json({ ok: false }, 404);
    if (isCorsDenied(requestHasOrigin, allowedCorsOrigin)) {
      return json({ ok: false }, 403);
    }
    const token = resolveUploadToken(request, url, route.pathToken);
    if (!token) return json({ ok: false }, 401);
    return await handleUpload(request, env, token);
  }

  if (route.kind === "catalog") {
    if (!route.storefront) return json({ ok: false }, 400);

    if (request.method === "PUT") {
      if (isCorsDenied(requestHasOrigin, allowedCorsOrigin)) {
        return json({ ok: false }, 403);
      }
      return await handleCatalogPublish(request, env, url, route.storefront);
    }
    if (request.method === "GET") {
      return await handleCatalogRead(request, env, url, route.storefront);
    }
    return json({ ok: false }, 404);
  }

  return json({ ok: false }, 404);
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const requestHasOrigin = Boolean(request.headers.get("origin"));
    const allowedCorsOrigin = resolveAllowedCorsOrigin(request, env);
    const response = await routeRequest({
      request,
      env,
      url,
      requestHasOrigin,
      allowedCorsOrigin,
    });
    return withCors(request, response, allowedCorsOrigin);
  },
};

export default worker;
