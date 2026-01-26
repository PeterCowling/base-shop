import "server-only";

import { promises as fs } from "node:fs";
import * as path from "node:path";

import { resolveLocale } from "@acme/i18n/locales";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
/* eslint-disable security/detect-non-literal-fs-filename -- CMP-0001 [ttl=2026-12-31] demo upload route pending hardening/i18n */
import { resolveDataRoot } from "@acme/platform-core/dataRoot";
import { validateShopName } from "@acme/platform-core/shops";

export const runtime = "nodejs";

const NOT_FOUND_KEY = "api.uploads.notFound";

function extractLocaleFromAcceptLanguage(value: string | null | undefined): string | undefined {
  const primary = value?.split(",")[0]?.split(";")[0]?.trim();
  const normalized = primary?.split("-")[0]?.toLowerCase();
  return normalized || undefined;
}

function resolveRequestLocale(request: Request) {
  return resolveLocale(extractLocaleFromAcceptLanguage(request.headers.get("accept-language")));
}

function isSafeBasename(value: string): boolean {
  if (!value) return false;
  if (value === "." || value === "..") return false;
  if (value.includes("\0")) return false;
  if (value.includes("/") || value.includes("\\")) return false;
  return true;
}

function contentTypeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".mov":
      return "video/quicktime";
    default:
      return "application/octet-stream";
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ shop: string; filename: string }> },
) {
  const locale = resolveRequestLocale(request);
  const t = await getTranslations(locale);
  const notFoundMessage = t(NOT_FOUND_KEY);
  const respondNotFound = () => new Response(notFoundMessage, { status: 404 });
  const { shop, filename } = await context.params;

  try {
    const safeShop = validateShopName(shop);
    if (!isSafeBasename(filename)) {
      return respondNotFound();
    }
    const root = resolveDataRoot();
    const uploadsRoot = path.join(root, safeShop, "uploads");
    const fullPath = path.join(uploadsRoot, filename);
    const relative = path.relative(uploadsRoot, fullPath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      return respondNotFound();
    }
    const buf = await fs.readFile(fullPath).catch((err) => {
      if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return null;
      throw err;
    });
    if (!buf) {
      return respondNotFound();
    }
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": contentTypeFor(filename),
        "Cache-Control": "public, max-age=31536000, immutable", // i18n-exempt -- ABC-358 [ttl=2026-12-31] HTTP header value
      },
    });
  } catch {
    return respondNotFound();
  }
}
