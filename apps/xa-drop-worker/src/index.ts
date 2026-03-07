import { catalogProductDraftSchema } from "@acme/lib/xa";

import { acquireDraftSyncLock, releaseDraftSyncLock } from "./draftSyncLock";

export interface Env {
  SUBMISSIONS_BUCKET: R2Bucket;
  CATALOG_BUCKET?: R2Bucket;
  UPLOAD_TOKEN_SECRET?: string;
  CATALOG_WRITE_TOKEN?: string;
  CATALOG_READ_TOKEN?: string;
  XA_DEPLOY_TRIGGER_TOKEN?: string;
  XA_B_PAGES_DEPLOY_HOOK_URL?: string;
  XA_GITHUB_ACTIONS_TOKEN?: string;
  XA_GITHUB_REPO_OWNER?: string;
  XA_GITHUB_REPO_NAME?: string;
  XA_GITHUB_WORKFLOW_FILE?: string;
  XA_GITHUB_WORKFLOW_REF?: string;
  R2_PREFIX?: string;
  CATALOG_PREFIX?: string;
  MAX_BYTES?: string;
  CATALOG_MAX_BYTES?: string;
  UPLOAD_ALLOWED_ORIGINS?: string;
  UPLOAD_TOKEN_MAX_TTL_SECONDS?: string;
  UPLOAD_ALLOW_URL_TOKENS?: string;
  CATALOG_ALLOW_QUERY_TOKEN?: string;
  ALLOWED_IPS?: string;
}

type VerifiedToken = {
  iat: number;
  exp: number;
  nonce: string;
};

const DEFAULT_UPLOAD_TOKEN_MAX_TTL_SECONDS = 15 * 60;

type CatalogPayload = {
  storefront?: string;
  version?: string;
  publishedAt?: string;
  catalog?: unknown;
  mediaIndex?: unknown;
};

type DraftPayload = {
  storefront?: string;
  products?: unknown;
  revisionsById?: unknown;
  ifMatchDocRevision?: unknown;
};

const TOKEN_VERSION = "v1";
const DEFAULT_PREFIX = "submissions/";
const DEFAULT_CATALOG_PREFIX = "catalog/";
const DEFAULT_MAX_BYTES = 25 * 1024 * 1024;
const DEFAULT_CATALOG_MAX_BYTES = 10 * 1024 * 1024;
const DEFAULT_DRAFTS_MAX_BYTES = 2 * 1024 * 1024;
// i18n-exempt -- ABC-123 [ttl=2026-12-31]
const DEFAULT_CATALOG_CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300";
const PUBLIC_CATALOG_STOREFRONTS = new Set(["xa-b"]);
// i18n-exempt -- ABC-123 [ttl=2026-12-31]
const CORS_ALLOWED_HEADERS =
  "Content-Type, X-XA-Submission-Id, X-XA-Upload-Token, X-XA-Catalog-Token, X-XA-Deploy-Token, X-XA-Sync-Lock-Owner, Authorization"; // i18n-exempt -- ABC-123 [ttl=2026-12-31]
// i18n-exempt -- ABC-123 [ttl=2026-12-31]
const CORS_ALLOWED_METHODS = "GET, PUT, DELETE, OPTIONS";

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

function parseAllowedIps(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

function firstHeaderIp(raw: string | null): string {
  return (raw ?? "").split(",")[0]?.trim() ?? "";
}

function requestIp(request: Request): string {
  const cfConnectingIp = firstHeaderIp(request.headers.get("cf-connecting-ip"));
  if (cfConnectingIp) return cfConnectingIp;

  const forwarded = firstHeaderIp(request.headers.get("x-forwarded-for"));
  if (forwarded) return forwarded;

  return firstHeaderIp(request.headers.get("x-real-ip"));
}

function isIpAllowed(request: Request, env: Env): boolean {
  const allowlisted = parseAllowedIps(env.ALLOWED_IPS);
  if (!allowlisted.size) return true;
  const ip = requestIp(request);
  if (!ip) return false;
  return allowlisted.has(ip);
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

async function verifyUploadToken(token: string, secret: string, maxTtlSeconds: number): Promise<VerifiedToken> {
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
  if (exp - iat > maxTtlSeconds) throw new Error("invalid_token");

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
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_MAX_BYTES;
  return Math.min(Math.round(raw), DEFAULT_MAX_BYTES);
}

function resolveUploadTokenMaxTtlSeconds(env: Env): number {
  const raw = typeof (env as Env & { UPLOAD_TOKEN_MAX_TTL_SECONDS?: string }).UPLOAD_TOKEN_MAX_TTL_SECONDS === "string"
    ? Number((env as Env & { UPLOAD_TOKEN_MAX_TTL_SECONDS?: string }).UPLOAD_TOKEN_MAX_TTL_SECONDS)
    : NaN;
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_UPLOAD_TOKEN_MAX_TTL_SECONDS;
  return Math.min(Math.round(raw), DEFAULT_UPLOAD_TOKEN_MAX_TTL_SECONDS);
}

function resolveCatalogMaxBytes(env: Env): number {
  const raw = typeof env.CATALOG_MAX_BYTES === "string" ? Number(env.CATALOG_MAX_BYTES) : NaN;
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_CATALOG_MAX_BYTES;
  return Math.min(Math.round(raw), DEFAULT_CATALOG_MAX_BYTES);
}

function resolveDraftsMaxBytes(env: Env): number {
  const raw = typeof env.CATALOG_MAX_BYTES === "string" ? Number(env.CATALOG_MAX_BYTES) : NaN;
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_DRAFTS_MAX_BYTES;
  return Math.min(Math.round(raw), DEFAULT_DRAFTS_MAX_BYTES);
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

function resolveUploadToken(request: Request): string {
  const headerToken = request.headers.get("x-xa-upload-token")?.trim();
  if (headerToken) return headerToken;

  const authToken = bearerTokenFrom(request.headers.get("authorization"));
  if (authToken) return authToken;

  return "";
}

function allowUploadUrlTokens(env: Env): boolean {
  return (env.UPLOAD_ALLOW_URL_TOKENS ?? "").trim() === "1";
}

function resolveUploadTokenLegacy(url: URL, pathToken: string): string {
  const queryToken = url.searchParams.get("token")?.trim();
  if (queryToken) return queryToken;
  return decodePathSegment(pathToken).trim();
}

function resolveCatalogToken(request: Request, url: URL, env: Env): string {
  const headerToken = request.headers.get("x-xa-catalog-token")?.trim();
  if (headerToken) return headerToken;

  const authToken = bearerTokenFrom(request.headers.get("authorization"));
  if (authToken) return authToken;

  if ((env.CATALOG_ALLOW_QUERY_TOKEN ?? "").trim() === "1") {
    const queryToken = url.searchParams.get("token")?.trim();
    if (queryToken) return queryToken;
  }

  return "";
}

function resolveCatalogBucket(env: Env): R2Bucket {
  return env.CATALOG_BUCKET ?? env.SUBMISSIONS_BUCKET;
}

function resolveCatalogPrefix(env: Env): string {
  return normalizePrefix(env.CATALOG_PREFIX || DEFAULT_CATALOG_PREFIX);
}

function draftsCatalogKey(prefix: string, storefront: string): string {
  return `${prefix}drafts/${storefront}/latest.json`;
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

function parseOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

async function requireCatalogWriteToken(
  env: Env,
  request: Request,
  url: URL,
): Promise<Response | string> {
  const expectedToken = (env.CATALOG_WRITE_TOKEN ?? "").trim();
  if (!expectedToken || expectedToken.length < 16) {
    return json({ ok: false }, 503);
  }

  const providedToken = resolveCatalogToken(request, url, env);
  if (!providedToken || !constantTimeEqual(providedToken, expectedToken)) {
    return json({ ok: false }, 401);
  }
  return expectedToken;
}

async function requireCatalogReadToken(
  env: Env,
  request: Request,
  url: URL,
): Promise<Response | string> {
  const expectedReadToken = (env.CATALOG_READ_TOKEN ?? "").trim();
  if (expectedReadToken) {
    const expectedWriteToken = (env.CATALOG_WRITE_TOKEN ?? "").trim();
    const providedToken = resolveCatalogToken(request, url, env);
    const matchesReadToken = providedToken
      ? constantTimeEqual(providedToken, expectedReadToken)
      : false;
    const matchesWriteToken =
      providedToken && expectedWriteToken
        ? constantTimeEqual(providedToken, expectedWriteToken)
        : false;
    if (!matchesReadToken && !matchesWriteToken) {
      return json({ ok: false }, 401);
    }
    return matchesReadToken ? expectedReadToken : expectedWriteToken;
  }
  return await requireCatalogWriteToken(env, request, url);
}

function validateDraftProducts(value: unknown): unknown[] | null {
  if (!Array.isArray(value)) return null;
  const normalized: unknown[] = [];
  for (const entry of value) {
    const parsed = catalogProductDraftSchema.safeParse(entry);
    if (!parsed.success) return null;
    normalized.push(parsed.data);
  }
  return normalized;
}

async function parseDraftPayload(request: Request, maxBytes: number): Promise<DraftPayload | Response> {
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
  return parsed as DraftPayload;
}

async function verifyTokenOrRespond(token: string, secret: string, maxTtlSeconds: number): Promise<VerifiedToken | Response> {
  try {
    return await verifyUploadToken(token, secret, maxTtlSeconds);
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

  const verified = await verifyTokenOrRespond(token, secret, resolveUploadTokenMaxTtlSeconds(env));
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
  const auth = await requireCatalogWriteToken(env, request, url);
  if (auth instanceof Response) return auth;

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

async function handleDraftRead(request: Request, env: Env, url: URL, storefront: string): Promise<Response> {
  const auth = await requireCatalogReadToken(env, request, url);
  if (auth instanceof Response) return auth;

  const bucket = resolveCatalogBucket(env);
  const prefix = resolveCatalogPrefix(env);
  const key = draftsCatalogKey(prefix, storefront);
  const object = await bucket.get(key);
  if (!object) {
    return json({
      ok: true,
      storefront,
      products: [],
      revisionsById: {},
      docRevision: null,
      updatedAt: null,
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await object.text());
  } catch {
    return json({ ok: false }, 502);
  }
  if (!isObjectRecord(parsed)) return json({ ok: false }, 502);

  const products = Array.isArray(parsed.products) ? parsed.products : [];
  const revisionsById = isObjectRecord(parsed.revisionsById) ? parsed.revisionsById : {};
  const docRevision = parseOptionalString(parsed.docRevision) ?? null;
  const updatedAt = parseOptionalString(parsed.updatedAt) ?? null;

  return json({
    ok: true,
    storefront,
    products,
    revisionsById,
    docRevision,
    updatedAt,
  });
}

async function handleDraftWrite(
  request: Request,
  env: Env,
  url: URL,
  storefront: string,
): Promise<Response> {
  const auth = await requireCatalogWriteToken(env, request, url);
  if (auth instanceof Response) return auth;

  const payloadOrError = await parseDraftPayload(request, resolveDraftsMaxBytes(env));
  if (payloadOrError instanceof Response) return payloadOrError;
  const payload = payloadOrError;

  if (payload.storefront && payload.storefront !== storefront) {
    return json({ ok: false }, 400);
  }
  const normalizedProducts = validateDraftProducts(payload.products);
  if (!normalizedProducts || !isObjectRecord(payload.revisionsById)) {
    return json({ ok: false }, 400);
  }

  const normalizedRevisions = Object.fromEntries(
    Object.entries(payload.revisionsById).filter(
      ([key, value]) => typeof key === "string" && typeof value === "string" && key.trim() && value.trim(),
    ),
  );

  const bucket = resolveCatalogBucket(env);
  const prefix = resolveCatalogPrefix(env);
  const key = draftsCatalogKey(prefix, storefront);
  const expectedDocRevision = parseOptionalString(payload.ifMatchDocRevision);
  const existing = await bucket.get(key);
  let existingDocRevision: string | undefined;
  if (existing) {
    try {
      const existingParsed = JSON.parse(await existing.text()) as unknown;
      if (isObjectRecord(existingParsed)) {
        existingDocRevision = parseOptionalString(existingParsed.docRevision);
      }
    } catch {
      return json({ ok: false }, 502);
    }
  }

  if (expectedDocRevision) {
    if (!existingDocRevision || !constantTimeEqual(expectedDocRevision, existingDocRevision)) {
      return json({ ok: false, error: "conflict" }, 409);
    }
  }

  const updatedAt = new Date().toISOString();
  const docRevision = crypto.randomUUID().replace(/-/g, "");
  const record = {
    ok: true,
    storefront,
    updatedAt,
    docRevision,
    products: normalizedProducts,
    revisionsById: normalizedRevisions,
  };

  try {
    await bucket.put(key, `${JSON.stringify(record)}\n`, {
      httpMetadata: { contentType: "application/json" },
      customMetadata: {
        storefront,
        updatedAt,
        docRevision,
      },
    });
  } catch {
    return json({ ok: false }, 502);
  }

  return json({ ok: true, storefront, updatedAt, docRevision }, 201);
}

async function handleDraftDelete(request: Request, env: Env, url: URL, storefront: string): Promise<Response> {
  const auth = await requireCatalogWriteToken(env, request, url);
  if (auth instanceof Response) return auth;

  const bucket = resolveCatalogBucket(env);
  const prefix = resolveCatalogPrefix(env);
  const key = draftsCatalogKey(prefix, storefront);
  try {
    await bucket.delete(key);
  } catch {
    return json({ ok: false }, 502);
  }
  return json({ ok: true, storefront, deleted: true });
}

async function handleDraftSyncLockAcquire(
  request: Request,
  env: Env,
  url: URL,
  storefront: string,
): Promise<Response> {
  const auth = await requireCatalogWriteToken(env, request, url);
  if (auth instanceof Response) return auth;

  const bucket = resolveCatalogBucket(env);
  const prefix = resolveCatalogPrefix(env);
  const result = await acquireDraftSyncLock({ bucket, prefix, storefront });

  if (result.status === "busy") {
    return json(
      { ok: false, error: "conflict", reason: "sync_lock_held", expiresAt: result.expiresAt },
      409,
    );
  }
  if (result.status === "error") {
    return json({ ok: false, reason: result.reason }, 502);
  }

  return json(
    {
      ok: true,
      storefront,
      ownerToken: result.ownerToken,
      expiresAt: result.expiresAt,
    },
    201,
  );
}

async function handleDraftSyncLockRelease(
  request: Request,
  env: Env,
  url: URL,
  storefront: string,
): Promise<Response> {
  const auth = await requireCatalogWriteToken(env, request, url);
  if (auth instanceof Response) return auth;

  const ownerToken = request.headers.get("x-xa-sync-lock-owner")?.trim() ?? "";
  if (!ownerToken) {
    return json({ ok: false, reason: "sync_lock_owner_missing" }, 400);
  }

  const bucket = resolveCatalogBucket(env);
  const prefix = resolveCatalogPrefix(env);
  const result = await releaseDraftSyncLock({ bucket, prefix, storefront, ownerToken });

  if (result.status === "missing") {
    return json({ ok: false, reason: "sync_lock_missing" }, 404);
  }
  if (result.status === "stale_owner") {
    return json({ ok: false, error: "conflict", reason: "sync_lock_stale_owner" }, 409);
  }
  if (result.status === "error") {
    return json({ ok: false, reason: result.reason }, 502);
  }

  return json({ ok: true, storefront, released: true });
}

async function handleCatalogRead(
  request: Request,
  env: Env,
  url: URL,
  storefront: string,
): Promise<Response> {
  const auth = await requireCatalogReadToken(env, request, url);
  if (auth instanceof Response) return auth;

  return await respondWithCatalogObject(request, env, storefront);
}

async function respondWithCatalogObject(
  request: Request,
  env: Env,
  storefront: string,
  extraHeaders?: HeadersInit,
): Promise<Response> {
  const bucket = resolveCatalogBucket(env);
  const prefix = resolveCatalogPrefix(env);
  const key = latestCatalogKey(prefix, storefront);
  const object = await bucket.get(key);
  if (!object) return json({ ok: false }, 404);

  const etag = normalizeEtag((object as unknown as { httpEtag?: string }).httpEtag ?? "");
  const ifNoneMatch = (request.headers.get("if-none-match") ?? "").trim();
  if (etag && ifNoneMatch === etag) {
    const notModifiedHeaders = new Headers({
      "Cache-Control": DEFAULT_CATALOG_CACHE_CONTROL,
      ...extraHeaders,
    });
    notModifiedHeaders.set("ETag", etag);
    return new Response(null, { status: 304, headers: notModifiedHeaders });
  }

  const body = await object.text();
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": DEFAULT_CATALOG_CACHE_CONTROL,
    ...extraHeaders,
  });
  if (etag) headers.set("ETag", etag);
  return new Response(body, { status: 200, headers });
}

async function handlePublicCatalogRead(
  request: Request,
  env: Env,
  storefront: string,
): Promise<Response> {
  if (!PUBLIC_CATALOG_STOREFRONTS.has(storefront)) {
    return json({ ok: false }, 404, { "Access-Control-Allow-Origin": "*" });
  }

  return await respondWithCatalogObject(request, env, storefront, {
    "Access-Control-Allow-Origin": "*",
  });
}

type RouteMatch =
  | { kind: "upload"; pathToken: string }
  | { kind: "catalog"; storefront: string | null }
  | { kind: "publicCatalog"; storefront: string | null }
  | { kind: "drafts"; storefront: string | null }
  | { kind: "draftSyncLock"; storefront: string | null }
  | { kind: "deploy"; storefront: string | null }
  | { kind: "other" };

function matchPairRoute(first: string, second: string): RouteMatch | null {
  const storefront = parseStorefront(second);
  if (first === "catalog") return { kind: "catalog", storefront };
  if (first === "catalog-public") return { kind: "publicCatalog", storefront };
  if (first === "drafts") return { kind: "drafts", storefront };
  if (first === "deploy") return { kind: "deploy", storefront };
  return null;
}

function matchRoute(pathname: string): RouteMatch {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 1 && segments.length <= 2 && segments[0] === "upload") {
    return {
      kind: "upload",
      pathToken: segments.length === 2 ? (segments[1] ?? "") : "",
    };
  }
  if (segments.length === 2) {
    const pairRoute = matchPairRoute(segments[0] ?? "", segments[1] ?? "");
    if (pairRoute) return pairRoute;
  }
  if (segments.length === 3 && segments[0] === "drafts" && segments[2] === "sync-lock") {
    return {
      kind: "draftSyncLock",
      storefront: parseStorefront(segments[1] ?? ""),
    };
  }
  return { kind: "other" };
}

function requireDeployTriggerToken(
  env: Env,
  request: Request,
  url: URL,
): Response | string {
  const expectedToken = (env.XA_DEPLOY_TRIGGER_TOKEN ?? "").trim();
  if (!expectedToken || expectedToken.length < 16) {
    return json({ ok: false }, 503);
  }

  const providedToken =
    request.headers.get("x-xa-deploy-token")?.trim() ||
    bearerTokenFrom(request.headers.get("authorization")) ||
    url.searchParams.get("token")?.trim() ||
    "";
  if (!providedToken || !constantTimeEqual(providedToken, expectedToken)) {
    return json({ ok: false }, 401);
  }

  return expectedToken;
}

function resolveXaBPagesDeployHookUrl(env: Env): string | null {
  const raw = (env.XA_B_PAGES_DEPLOY_HOOK_URL ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function resolveXaBDeployConfig(env: Env): {
  token: string;
  owner: string;
  repo: string;
  workflow: string;
  ref: string;
} | null {
  const token = (env.XA_GITHUB_ACTIONS_TOKEN ?? "").trim();
  const owner = (env.XA_GITHUB_REPO_OWNER ?? "petercowling").trim();
  const repo = (env.XA_GITHUB_REPO_NAME ?? "base-shop").trim();
  const workflow = (env.XA_GITHUB_WORKFLOW_FILE ?? "xa-b-redeploy.yml").trim();
  const ref = (env.XA_GITHUB_WORKFLOW_REF ?? "dev").trim() || "dev";
  if (!token || !owner || !repo || !workflow || !ref) return null;
  return { token, owner, repo, workflow, ref };
}

type XaBDeployConfig = NonNullable<ReturnType<typeof resolveXaBDeployConfig>>;

function resolveAllowedUploaderDeployWorkflowId(workflow: string): string | null {
  const normalized = workflow.trim().replace(/\\/g, "/").toLowerCase();
  if (!normalized) return null;
  if (normalized === "xa-b-redeploy.yml") return "xa-b-redeploy.yml";
  if (normalized === ".github/workflows/xa-b-redeploy.yml") return "xa-b-redeploy.yml";
  return null;
}

function buildDisallowedWorkflowResponse(workflow: string): Response {
  return json(
    {
      ok: false,
      error: {
        message: "deploy_workflow_not_allowed",
        workflow,
      },
    },
    503,
  );
}

function isRecordStringUnknown(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseApiErrorDetails(payload: unknown): { code?: number; message?: string } {
  if (!isRecordStringUnknown(payload)) return {};
  const directMessage = typeof payload.message === "string" ? payload.message : undefined;
  const errors = payload.errors;
  if (!Array.isArray(errors) || errors.length < 1) return { message: directMessage };
  const first = errors[0];
  if (!isRecordStringUnknown(first)) return { message: directMessage };
  const code = typeof first.code === "number" ? first.code : undefined;
  const message = typeof first.message === "string" ? first.message : directMessage;
  return { code, message };
}

type JsonRequestResult =
  | { ok: true; status: number; payload: Record<string, unknown> | null }
  | { ok: false; status: number; error: { code?: number; message?: string } };

async function requestJson(url: string, init: RequestInit): Promise<JsonRequestResult> {
  const response = await fetch(url, init).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    return { __fetchError: message } as const;
  });
  if (!response) {
    return { ok: false, status: 502, error: { message: "request_failed" } };
  }
  if ("__fetchError" in response) {
    return {
      ok: false,
      status: 502,
      error: {
        message: response.__fetchError || "request_failed",
      },
    };
  }

  const responseBodyText = await response.text().catch(() => "");
  let payload: Record<string, unknown> | null = null;
  if (responseBodyText) {
    try {
      const parsed = JSON.parse(responseBodyText) as unknown;
      payload = isRecordStringUnknown(parsed) ? parsed : null;
    } catch {
      payload = null;
    }
  }
  if (!response.ok) {
    const parsedError = parseApiErrorDetails(payload);
    const fallbackMessage = responseBodyText.trim().slice(0, 160);
    return {
      ok: false,
      status: response.status || 502,
      error:
        parsedError.code || parsedError.message
          ? parsedError
          : fallbackMessage
            ? { message: fallbackMessage }
            : {},
    };
  }
  return { ok: true, status: response.status, payload: isRecordStringUnknown(payload) ? payload : null };
}

function successPayloadFromDispatch(params: {
  storefront: string;
  workflow: string;
  owner: string;
  repo: string;
  ref: string;
}) {
  const workflowUrl = `https://github.com/${encodeURIComponent(params.owner)}/${encodeURIComponent(params.repo)}/actions/workflows/${encodeURIComponent(params.workflow)}`;
  return {
    ok: true,
    storefront: params.storefront,
    provider: "github_actions",
    workflow: params.workflow,
    workflowUrl,
    ref: params.ref,
  };
}

function buildDispatchBody(params: { storefront: string; ref: string }): string {
  void params.storefront;
  return JSON.stringify({
    ref: params.ref,
  });
}

function githubDispatchUrl(config: XaBDeployConfig): string {
  return `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/actions/workflows/${encodeURIComponent(config.workflow)}/dispatches`;
}

function dispatchHeaders(config: XaBDeployConfig): HeadersInit {
  return {
    Authorization: `Bearer ${config.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "xa-drop-worker",
  };
}

function parseGitHubError(payload: Record<string, unknown> | null): { code?: number; message?: string } {
  if (!payload) return {};
  const message = typeof payload.message === "string" ? payload.message : undefined;
  return { message };
}

function normalizeDispatchFailureStatus(status: number): number {
  if (status === 401 || status === 403) return 502;
  if (status >= 400 && status < 500) return 503;
  return 502;
}

type HookRequestResult =
  | { ok: true; status: number }
  | { ok: false; status: number };

async function triggerPagesDeployHook(url: string): Promise<HookRequestResult> {
  const response = await fetch(url, { method: "POST" }).catch(() => null);
  if (!response) return { ok: false, status: 502 };
  if (!response.ok) return { ok: false, status: response.status || 502 };
  return { ok: true, status: response.status };
}

function buildPagesHookFailureResponse(result: HookRequestResult & { ok: false }): Response {
  if (result.status >= 400 && result.status < 500) {
    return json({ ok: false, error: { message: "pages_hook_rejected" } }, 503);
  }
  return json({ ok: false, error: { message: "pages_hook_failed" } }, 502);
}

function successPayloadFromPagesHook(params: { storefront: string }): {
  ok: true;
  storefront: string;
  provider: "cloudflare_pages_deploy_hook";
} {
  return {
    ok: true,
    storefront: params.storefront,
    provider: "cloudflare_pages_deploy_hook",
  };
}

function normalizeDispatchFailureError(
  result: JsonRequestResult & { ok: false },
): { code?: number; message?: string } {
  if (result.error.message || result.error.code) return result.error;
  return { message: "dispatch_failed" };
}

function buildDispatchFailureResponse(result: JsonRequestResult & { ok: false }): Response {
  const status = normalizeDispatchFailureStatus(result.status);
  return json({ ok: false, error: normalizeDispatchFailureError(result) }, status);
}

function successPayloadFromDispatchResult(params: {
  payload: Record<string, unknown>;
  storefront: string;
  workflow: string;
  owner: string;
  repo: string;
  ref: string;
}) {
  const result = isRecordStringUnknown(params.payload.result) ? params.payload.result : {};
  void result;
  return successPayloadFromDispatch({
    storefront: params.storefront,
    workflow: params.workflow,
    owner: params.owner,
    repo: params.repo,
    ref: params.ref,
  });
}

type WorkflowDispatchResult =
  | { ok: true; payload: ReturnType<typeof successPayloadFromDispatchResult> }
  | { ok: false; response: Response };

async function dispatchXaBRedeployWorkflow(params: {
  config: XaBDeployConfig;
  storefront: string;
}): Promise<WorkflowDispatchResult> {
  const allowedWorkflowId = resolveAllowedUploaderDeployWorkflowId(params.config.workflow);
  if (!allowedWorkflowId) {
    return { ok: false, response: buildDisallowedWorkflowResponse(params.config.workflow) };
  }

  const config = { ...params.config, workflow: allowedWorkflowId };
  const dispatch = await requestJson(githubDispatchUrl(config), {
    method: "POST",
    headers: dispatchHeaders(config),
    body: buildDispatchBody({ storefront: params.storefront, ref: config.ref }),
  });
  if (!dispatch.ok) return { ok: false, response: buildDispatchFailureResponse(dispatch) };
  if (dispatch.status !== 204) {
    const error = parseGitHubError(dispatch.payload);
    return {
      ok: false,
      response: json(
        { ok: false, error: error.message ? error : { message: "dispatch_unexpected_status" } },
        502,
      ),
    };
  }
  return {
    ok: true,
    payload: successPayloadFromDispatchResult({
      payload: dispatch.payload ?? {},
      storefront: params.storefront,
      workflow: config.workflow,
      owner: config.owner,
      repo: config.repo,
      ref: config.ref,
    }),
  };
}

async function handleXaBDeployTrigger(request: Request, env: Env, storefront: string): Promise<Response> {
  if (storefront !== "xa-b") return json({ ok: false }, 400);

  const requestUrl = new URL(request.url);
  const auth = requireDeployTriggerToken(env, request, requestUrl);
  if (auth instanceof Response) return auth;

  const config = resolveXaBDeployConfig(env);
  const pagesHookUrl = resolveXaBPagesDeployHookUrl(env);
  if (pagesHookUrl) {
    const hook = await triggerPagesDeployHook(pagesHookUrl);
    if (!hook.ok) {
      if (!config) return buildPagesHookFailureResponse(hook);
      const fallbackDispatch = await dispatchXaBRedeployWorkflow({ config, storefront });
      if (!fallbackDispatch.ok) return fallbackDispatch.response;
      return json(
        {
          ...fallbackDispatch.payload,
          fallbackFrom: "cloudflare_pages_deploy_hook",
          fallbackReason:
            hook.status >= 400 && hook.status < 500 ? "pages_hook_rejected" : "pages_hook_failed",
        },
        202,
      );
    }
    return json(successPayloadFromPagesHook({ storefront }), 202);
  }

  if (!config) return json({ ok: false }, 503);
  const dispatchResult = await dispatchXaBRedeployWorkflow({ config, storefront });
  if (!dispatchResult.ok) return dispatchResult.response;
  return json(dispatchResult.payload, 202);
}

function isCorsDenied(requestHasOrigin: boolean, allowedCorsOrigin: string | null): boolean {
  return requestHasOrigin && !allowedCorsOrigin;
}

// eslint-disable-next-line complexity -- XAUP-0101 cloud contract routing branches are intentionally explicit
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
    if (
      route.kind === "upload" ||
      route.kind === "catalog" ||
      route.kind === "drafts" ||
      route.kind === "deploy"
    ) {
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
    let token = resolveUploadToken(request);
    if (!token && allowUploadUrlTokens(env)) {
      token = resolveUploadTokenLegacy(url, route.pathToken);
    }
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

  if (route.kind === "publicCatalog") {
    if (!route.storefront) return json({ ok: false }, 404, { "Access-Control-Allow-Origin": "*" });
    if (request.method === "GET") {
      return await handlePublicCatalogRead(request, env, route.storefront);
    }
    return json({ ok: false }, 404, { "Access-Control-Allow-Origin": "*" });
  }

  if (route.kind === "drafts") {
    if (!route.storefront) return json({ ok: false }, 400);
    if (request.method === "GET") {
      return await handleDraftRead(request, env, url, route.storefront);
    }
    if (request.method === "PUT") {
      if (isCorsDenied(requestHasOrigin, allowedCorsOrigin)) {
        return json({ ok: false }, 403);
      }
      return await handleDraftWrite(request, env, url, route.storefront);
    }
    if (request.method === "DELETE") {
      if (isCorsDenied(requestHasOrigin, allowedCorsOrigin)) {
        return json({ ok: false }, 403);
      }
      return await handleDraftDelete(request, env, url, route.storefront);
    }
    return json({ ok: false }, 404);
  }

  if (route.kind === "draftSyncLock") {
    if (!route.storefront) return json({ ok: false }, 400);
    if (request.method === "POST") {
      return await handleDraftSyncLockAcquire(request, env, url, route.storefront);
    }
    if (request.method === "DELETE") {
      return await handleDraftSyncLockRelease(request, env, url, route.storefront);
    }
    return json({ ok: false }, 404);
  }

  if (route.kind === "deploy") {
    if (!route.storefront) return json({ ok: false }, 400);
    if (request.method !== "POST") return json({ ok: false }, 404);
    return await handleXaBDeployTrigger(request, env, route.storefront);
  }

  return json({ ok: false }, 404);
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const requestHasOrigin = Boolean(request.headers.get("origin"));
    const allowedCorsOrigin = resolveAllowedCorsOrigin(request, env);
    if (!isIpAllowed(request, env)) {
      return withCors(request, json({ ok: false }, 404), allowedCorsOrigin);
    }
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
