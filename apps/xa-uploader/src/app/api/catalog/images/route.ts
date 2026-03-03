/* eslint-disable ds/no-hardcoded-copy -- XAUP-0001 [ttl=2026-12-31] machine-token route guards and reason codes */

import { NextResponse } from "next/server";

import { validateMinImageEdge } from "@acme/lib/math/ops";
import { parseImageDimensionsFromBuffer } from "@acme/lib/xa";

import { getMediaBucket } from "../../../../lib/r2Media";
import { applyRateLimitHeaders, getRequestIp, rateLimit } from "../../../../lib/rateLimit";
import { hasUploaderSession } from "../../../../lib/uploaderAuth";

export const runtime = "nodejs";

type ImageUploadErrorCode =
  | "no_file"
  | "missing_params"
  | "invalid_file_type"
  | "file_too_large"
  | "image_too_small"
  | "upload_failed"
  | "rate_limited"
  | "r2_unavailable";

const UPLOAD_WINDOW_MS = 60 * 1000;
const UPLOAD_MAX_REQUESTS = 10;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const MIN_IMAGE_EDGE_PX = 1600;

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

  // Get R2 bucket
  const bucket = await getMediaBucket();
  if (!bucket) {
    return withRateHeaders(
      buildErrorResponse("r2_unavailable", 503, "R2 media bucket is not available"),
      limit,
    );
  }

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

  // Dimension validation
  const dims = parseImageDimensionsFromBuffer(buf);
  if (!dims || !validateMinImageEdge(dims.width, dims.height, MIN_IMAGE_EDGE_PX)) {
    return withRateHeaders(
      buildErrorResponse(
        "image_too_small",
        400,
        `image shortest edge must be at least ${MIN_IMAGE_EDGE_PX}px`,
      ),
      limit,
    );
  }

  // Build R2 key: {storefront}/{slug}/{timestamp}-{role}.{ext}
  const timestamp = Math.floor(Date.now() / 1000);
  const ext = fileExtForFormat(format);
  const r2Key = `${storefront}/${slug}/${timestamp}-${role}.${ext}`;

  // Upload to R2
  const contentType = ALLOWED_TYPES.get(format) ?? "application/octet-stream";
  try {
    await bucket.put(r2Key, arrayBuffer, {
      httpMetadata: { contentType },
    });
  } catch {
    return withRateHeaders(buildErrorResponse("upload_failed", 500, "R2 upload failed"), limit);
  }

  return withRateHeaders(NextResponse.json({ ok: true, key: r2Key }), limit);
}
