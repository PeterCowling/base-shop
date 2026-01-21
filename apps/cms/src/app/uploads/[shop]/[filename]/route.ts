import "server-only";

import { promises as fs } from "node:fs";
import * as path from "node:path";

/* eslint-disable security/detect-non-literal-fs-filename -- CMS-0001 [ttl=2026-12-31] file IO paths derived from validated shop + params */
import { resolveDataRoot } from "@acme/platform-core/dataRoot";
import { validateShopName } from "@acme/platform-core/shops";

export const runtime = "nodejs";

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
  _req: Request,
  context: { params: Promise<{ shop: string; filename: string }> },
) {
  const { shop, filename } = await context.params;

  try {
    const safeShop = validateShopName(shop);
    if (!isSafeBasename(filename)) {
      return new Response("Not found", { status: 404 }); // i18n-exempt -- minimal route error
    }

    const root = resolveDataRoot();
    const uploadsRoot = path.join(root, safeShop, "uploads");
    const fullPath = path.join(uploadsRoot, filename);
    const relative = path.relative(uploadsRoot, fullPath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      return new Response("Not found", { status: 404 }); // i18n-exempt -- minimal route error
    }

    const buf = await fs.readFile(fullPath).catch((err) => {
      if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return null;
      throw err;
    });
    if (!buf) {
      return new Response("Not found", { status: 404 }); // i18n-exempt -- minimal route error
    }

    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": contentTypeFor(filename),
        "Cache-Control": "public, max-age=31536000, immutable", // i18n-exempt -- HTTP header value
      },
    });
  } catch {
    return new Response("Not found", { status: 404 }); // i18n-exempt -- minimal route error
  }
}
