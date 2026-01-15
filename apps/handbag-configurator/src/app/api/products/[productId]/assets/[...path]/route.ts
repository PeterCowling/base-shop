import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SAFE_SEGMENT = /^[a-zA-Z0-9._-]+$/;

function getContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".glb":
      return "model/gltf-binary";
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

  const repoRoot = path.resolve(process.cwd(), "../..");
  const filePath = path.join(repoRoot, "products", productId, "assets", ...assetPath);

  try {
    const data = await readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": getContentType(filePath),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
}
