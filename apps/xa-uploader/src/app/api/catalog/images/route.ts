/* eslint-disable ds/no-hardcoded-copy -- XAUP-0001 [ttl=2026-12-31] machine-token route guards and reason codes */

import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { slugify, splitList } from "@acme/lib/xa/catalogAdminSchema";

import {
  CatalogDraftContractError,
  readCloudDraftSnapshot,
  writeCloudDraftSnapshot,
} from "../../../../lib/catalogDraftContractClient";
import { ABSOLUTE_HTTP_URL_RE } from "../../../../lib/catalogPath";
import { parseStorefront } from "../../../../lib/catalogStorefront.ts";
import type { XaCatalogStorefront } from "../../../../lib/catalogStorefront.types";
import { getMediaBucket } from "../../../../lib/r2Media";
import { getRequestIp, rateLimit, withRateHeaders } from "../../../../lib/rateLimit";
import { hasUploaderSession } from "../../../../lib/uploaderAuth";
import { uploaderLog } from "../../../../lib/uploaderLogger";

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
const DELETE_WINDOW_MS = 60 * 1000;
const DELETE_MAX_REQUESTS = 30;
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

function buildUniqueFilename(ext: string): string {
  const nowMs = Date.now();
  const nonce = randomUUID().replace(/-/g, "").slice(0, 12);
  return `${nowMs}-${nonce}.${ext}`;
}
function buildErrorResponse(error: ImageUploadErrorCode, status: number, reason: string) {
  return NextResponse.json({ ok: false, error, reason }, { status });
}

type UploadFileLike = {
  size: number;
  type?: string;
  arrayBuffer(): Promise<ArrayBuffer>;
};

function isUploadFileLike(value: unknown): value is UploadFileLike {
  if (!value || typeof value !== "object") return false;
  return (
    "size" in value &&
    typeof (value as { size?: unknown }).size === "number" &&
    "arrayBuffer" in value &&
    typeof (value as { arrayBuffer?: unknown }).arrayBuffer === "function"
  );
}


function parseUploadQueryParams(requestUrl: string): {
  ok: true;
  storefront: string;
  slug: string;
} | {
  ok: false;
  reason: string;
} {
  const url = new URL(requestUrl);
  const rawStorefront = (url.searchParams.get("storefront") ?? "").trim();
  const rawSlug = (url.searchParams.get("slug") ?? "").trim();
  if (!rawStorefront || !rawSlug) {
    return { ok: false, reason: "storefront and slug query params are required" };
  }

  const storefront = parseStorefront(rawStorefront);
  if (storefront !== rawStorefront) {
    return { ok: false, reason: "invalid storefront query param" };
  }

  const slug = slugify(rawSlug);
  if (!slug) {
    return { ok: false, reason: "invalid slug query param" };
  }

  return { ok: true, storefront, slug };
}

const LEADING_SLASHES_RE = /^\/+/;

function normalizeCatalogPath(pathValue: string): string {
  const trimmed = pathValue.trim();
  if (!trimmed) return "";
  if (ABSOLUTE_HTTP_URL_RE.test(trimmed)) return "";
  return trimmed.replace(LEADING_SLASHES_RE, "");
}

function parseDeleteQueryParams(requestUrl: string): {
  ok: true;
  storefront: XaCatalogStorefront;
  key: string;
} | {
  ok: false;
  reason: string;
} {
  const url = new URL(requestUrl);
  const rawStorefront = (url.searchParams.get("storefront") ?? "").trim();
  const rawKey = (url.searchParams.get("key") ?? "").trim();
  if (!rawStorefront || !rawKey) {
    return { ok: false, reason: "storefront and key query params are required" };
  }

  const storefront = parseStorefront(rawStorefront);
  if (storefront !== rawStorefront) {
    return { ok: false, reason: "invalid storefront query param" };
  }

  const key = normalizeCatalogPath(rawKey);
  if (!key || key.includes("\\") || key.includes("..")) {
    return { ok: false, reason: "invalid image key query param" };
  }
  if (!key.startsWith("images/") && !key.startsWith(`${storefront}/`)) {
    return { ok: false, reason: "image key must be images/<slug>/<file> or <storefront>/<slug>/<file>" };
  }
  if (key.split("/").filter(Boolean).length < 3) {
    return { ok: false, reason: "image key must include storefront-or-images, slug, and filename segments" };
  }

  return { ok: true, storefront, key };
}

function buildKeyAliases(params: {
  storefront: XaCatalogStorefront;
  key: string;
}): Set<string> {
  const aliases = new Set<string>([params.key]);
  if (params.key.startsWith("images/")) {
    aliases.add(`${params.storefront}/${params.key.slice("images/".length)}`);
  } else if (params.key.startsWith(`${params.storefront}/`)) {
    aliases.add(`images/${params.key.slice(params.storefront.length + 1)}`);
  }
  return aliases;
}

function keyIsStillReferenced(params: {
  storefront: XaCatalogStorefront;
  key: string;
  products: { imageFiles?: string }[];
}): boolean {
  const aliases = buildKeyAliases(params);
  for (const product of params.products) {
    const imageFiles = splitList(product.imageFiles ?? "")
      .map((value) => normalizeCatalogPath(value))
      .filter(Boolean);
    if (imageFiles.some((pathValue) => aliases.has(pathValue))) {
      return true;
    }
  }
  return false;
}

async function deletePersistedImageKey(key: string): Promise<void> {
  const bucket = await getMediaBucket();
  if (!bucket) {
    throw new Error("media bucket unavailable");
  }
  await bucket.delete(key);
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

  const uploadParams = parseUploadQueryParams(request.url);
  if ("reason" in uploadParams) {
    return withRateHeaders(
      buildErrorResponse("missing_params", 400, uploadParams.reason),
      limit,
    );
  }
  const { storefront, slug } = uploadParams;

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
  if (!isUploadFileLike(file)) {
    return withRateHeaders(buildErrorResponse("no_file", 400, "no file field in form data"), limit);
  }
  uploaderLog("info", "upload_start", { storefront, slug, contentType: file.type ?? "unknown", bytes: file.size });

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

  const ext = fileExtForFormat(format);
  const filename = buildUniqueFilename(ext);

  const contentType = ALLOWED_TYPES.get(format) ?? "application/octet-stream";

  if (!bucket) {
    return withRateHeaders(buildErrorResponse("r2_unavailable", 503, "media_bucket_unavailable"), limit);
  }

  try {
    const r2Key = `${storefront}/${slug}/${filename}`;
    await bucket.put(r2Key, arrayBuffer, {
      httpMetadata: { contentType },
    });
    uploaderLog("info", "upload_success", { storefront, key: r2Key, bytes: buf.length });
    return withRateHeaders(NextResponse.json({ ok: true, key: r2Key }), limit);
  } catch {
    uploaderLog("error", "upload_failed", { storefront, errorCode: "upload_failed" });
    return withRateHeaders(buildErrorResponse("upload_failed", 500, "R2 upload failed"), limit);
  }
}

export async function DELETE(request: Request) {
  const requestIp = getRequestIp(request) || "unknown";
  const limit = rateLimit({
    key: `xa-uploader-images-delete:${requestIp}`,
    windowMs: DELETE_WINDOW_MS,
    max: DELETE_MAX_REQUESTS,
  });
  if (!limit.allowed) {
    return withRateHeaders(buildErrorResponse("rate_limited", 429, "delete_rate_limited"), limit);
  }

  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return withRateHeaders(NextResponse.json({ ok: false }, { status: 404 }), limit);
  }

  const deleteParams = parseDeleteQueryParams(request.url);
  if ("reason" in deleteParams) {
    return withRateHeaders(
      buildErrorResponse("missing_params", 400, deleteParams.reason),
      limit,
    );
  }

  const { storefront, key } = deleteParams;

  // 1. Read snapshot once — used for both reference check and fence write
  let snapshot: Awaited<ReturnType<typeof readCloudDraftSnapshot>>;
  try {
    snapshot = await readCloudDraftSnapshot(storefront);
  } catch {
    uploaderLog("error", "image_delete_reference_check_failed", { storefront, key });
    return withRateHeaders(buildErrorResponse("upload_failed", 500, "reference_check_failed"), limit);
  }

  // 2. Check if image is still referenced by any product
  const stillReferenced = keyIsStillReferenced({ storefront, key, products: snapshot.products });
  if (stillReferenced) {
    uploaderLog("info", "image_delete_skipped_referenced", { storefront, key });
    return withRateHeaders(
      NextResponse.json({ ok: true, deleted: false, skipped: "still_referenced" }),
      limit,
    );
  }

  // 3. Abort if docRevision is null — fencing is impossible without a stable revision
  if (snapshot.docRevision === null) {
    uploaderLog("warn", "image_delete_snapshot_revision_unavailable", { storefront, key });
    return withRateHeaders(
      NextResponse.json(
        { ok: false, error: "upload_failed", reason: "snapshot_revision_unavailable" },
        { status: 500 },
      ),
      limit,
    );
  }

  // 4. Write no-op fence update to detect concurrent mutations
  try {
    await writeCloudDraftSnapshot({
      storefront,
      products: snapshot.products,
      revisionsById: snapshot.revisionsById,
      ifMatchDocRevision: snapshot.docRevision,
    });
  } catch (error) {
    if (error instanceof CatalogDraftContractError && error.code === "conflict") {
      uploaderLog("warn", "image_delete_fence_conflict", { storefront, key });
      return withRateHeaders(
        NextResponse.json(
          { ok: false, error: "concurrent_edit", reason: "snapshot_changed_during_delete", concurrentEdit: true },
          { status: 409 },
        ),
        limit,
      );
    }
    uploaderLog("error", "image_delete_fence_write_failed", { storefront, key });
    return withRateHeaders(buildErrorResponse("upload_failed", 500, "fence_write_failed"), limit);
  }

  // 5. Fence passed — proceed to R2 delete (narrow residual window accepted per analysis)
  try {
    await deletePersistedImageKey(key);
    uploaderLog("info", "image_delete_success", { storefront, key });
    return withRateHeaders(NextResponse.json({ ok: true, deleted: true }), limit);
  } catch (error) {
    if (error instanceof Error && error.message === "media bucket unavailable") {
      uploaderLog("error", "image_delete_r2_unavailable", { storefront, key });
      return withRateHeaders(buildErrorResponse("r2_unavailable", 503, "media_bucket_unavailable"), limit);
    }
    uploaderLog("error", "image_delete_r2_failure", { storefront, key });
    return withRateHeaders(buildErrorResponse("upload_failed", 500, "image_delete_failed"), limit);
  }
}
