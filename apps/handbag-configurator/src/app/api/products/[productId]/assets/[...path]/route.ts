import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SAFE_SEGMENT = /^[a-zA-Z0-9._-]+$/;
const VERSIONED_DIR = /^v\\d+$/i;

function resolveRepoRoot() {
  const rootMarker = "pnpm-workspace.yaml";
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), ".."),
    path.resolve(process.cwd(), "../.."),
    path.resolve(process.cwd(), "../../.."),
  ];
  for (const candidate of candidates) {
    if (
      existsSync(path.join(candidate, "products")) &&
      existsSync(path.join(candidate, rootMarker))
    ) {
      return candidate;
    }
  }
  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, "products"))) {
      return candidate;
    }
  }
  return path.resolve(process.cwd(), "../..");
}

function getContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".glb":
      return "model/gltf-binary";
    case ".gltf":
      return "model/gltf+json";
    case ".hdr":
      return "image/vnd.radiance";
    case ".ktx2":
      return "image/ktx2";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    default:
      return "application/octet-stream";
  }
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ productId: string; path?: string[] }>;
  },
) {
  const { productId, path: assetPath = [] } = await params;

  if (
    !SAFE_SEGMENT.test(productId) ||
    assetPath.some((segment) => !SAFE_SEGMENT.test(segment))
  ) {
    return NextResponse.json({ error: "Invalid asset path" }, { status: 400 });
  }

  const repoRoot = resolveRepoRoot();
  const filePath = path.join(repoRoot, "products", productId, "assets", ...assetPath);
  const isVersionedAsset = assetPath.length > 0 && VERSIONED_DIR.test(assetPath[0] ?? "");
  const cacheControl = isVersionedAsset
    ? "public, max-age=31536000, immutable"
    : "no-store";

  try {
    const data = await readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": getContentType(filePath),
        "Cache-Control": cacheControl,
      },
    });
  } catch {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
}
