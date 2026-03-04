/* eslint-disable ds/no-hardcoded-copy -- XAUP-0001 [ttl=2026-12-31] machine-token route guards and reason codes */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { NextResponse } from "next/server";

import { getMediaBucket } from "../../../../lib/r2Media";
import { applyRateLimitHeaders, getRequestIp, rateLimit } from "../../../../lib/rateLimit";
import { hasUploaderSession } from "../../../../lib/uploaderAuth";

export const runtime = "nodejs";

type ImageUploadErrorCode =
  | "no_file"
  | "missing_params"
  | "invalid_file_type"
  | "file_too_large"
  | "upload_failed"
  | "rate_limited"
  | "r2_unavailable";

const UPLOAD_WINDOW_MS = 60 * 1000;
const UPLOAD_MAX_REQUESTS = 10;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

const ALLOWED_TYPES: ReadonlyMap<string, string> = new Map([
  ["jpeg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
]);

/** Detect image format from magic bytes. */
function detectImageFormat(buf: Buffer): string | null {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) return "jpeg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

function fileExtForFormat(format: string): string {
  if (format === "jpeg") return "jpg";
  return format;
}

function buildErrorResponse(error: ImageUploadErrorCode, status: number, reason: string) {
  return NextResponse.json({ ok: false, error, reason }, { status });
}

function withRateHeaders(response: NextResponse, limit: ReturnType<typeof rateLimit>): NextResponse {
  applyRateLimitHeaders(response.headers, limit);
  return response;
}

export async function POST(request: Request) {
  const requestIp = getRequestIp(request) || "unknown";
  const limit = rateLimit({
    key: `xa-uploader-images-post:${requestIp}`,
    windowMs: UPLOAD_WINDOW_MS,
    max: UPLOAD_MAX_REQUESTS,
  });
  if (!limit.allowed) {
    return withRateHeaders(buildErrorResponse("rate_limited", 429, "upload_rate_limited"), limit);
  }

  // Auth — return 404 for unauth (consistent with existing catalog routes)
  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return withRateHeaders(NextResponse.json({ ok: false }, { status: 404 }), limit);
  }

  // Parse query params
  const url = new URL(request.url);
  const storefront = url.searchParams.get("storefront");
  const slug = url.searchParams.get("slug");
  const role = url.searchParams.get("role");
  if (!storefront || !slug || !role) {
    return withRateHeaders(
      buildErrorResponse("missing_params", 400, "storefront, slug, and role query params are required"),
      limit,
    );
  }

  // Get R2 bucket (null in local dev)
  const bucket = await getMediaBucket();

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return withRateHeaders(buildErrorResponse("no_file", 400, "invalid or missing multipart form data"), limit);
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return withRateHeaders(buildErrorResponse("no_file", 400, "no file field in form data"), limit);
  }

  // File size check
  if (file.size > MAX_IMAGE_BYTES) {
    return withRateHeaders(
      buildErrorResponse("file_too_large", 413, `file exceeds ${MAX_IMAGE_BYTES} byte limit`),
      limit,
    );
  }

  // Read file into buffer
  const arrayBuffer = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);

  // Magic bytes type validation
  const format = detectImageFormat(buf);
  if (!format || !ALLOWED_TYPES.has(format)) {
    return withRateHeaders(
      buildErrorResponse("invalid_file_type", 400, "file must be JPG, PNG, or WebP (detected by magic bytes)"),
      limit,
    );
  }


  // Build filename: {timestamp}-{role}.{ext}
  const timestamp = Math.floor(Date.now() / 1000);
  const ext = fileExtForFormat(format);
  const filename = `${timestamp}-${role}.${ext}`;

  // Upload to R2 (production) or write into xa-b's public/images/ (dev).
  // In dev the file lands where xa-b serves static assets, so the image is
  // immediately visible on the storefront without an extra copy step.
  const contentType = ALLOWED_TYPES.get(format) ?? "application/octet-stream";

  // Path relative to public/ that both apps use: images/{slug}/{file}
  const catalogPath = `images/${slug}/${filename}`;

  if (bucket) {
    const r2Key = `${storefront}/${slug}/${filename}`;
    try {
      await bucket.put(r2Key, arrayBuffer, {
        httpMetadata: { contentType },
      });
    } catch {
      return withRateHeaders(buildErrorResponse("upload_failed", 500, "R2 upload failed"), limit);
    }
    return withRateHeaders(NextResponse.json({ ok: true, key: r2Key }), limit);
  }

  // Local filesystem fallback — write directly into xa-b/public/images/{slug}/
  // so that both xa-uploader (via symlink) and xa-b serve the same file.
  try {
    const xaBPublicImages = join(process.cwd(), "..", "xa-b", "public", "images", slug);
    await mkdir(xaBPublicImages, { recursive: true });
    await writeFile(join(xaBPublicImages, filename), Buffer.from(arrayBuffer));
  } catch {
    return withRateHeaders(buildErrorResponse("upload_failed", 500, "local file write failed"), limit);
  }

  return withRateHeaders(NextResponse.json({ ok: true, key: catalogPath }), limit);
}
