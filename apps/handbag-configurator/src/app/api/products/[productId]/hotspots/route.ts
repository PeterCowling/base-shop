import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { SAFE_SEGMENT, sanitizeHotspots } from "./hotspotUtils";

export const runtime = "nodejs";

type HotspotPayload = {
  productId?: unknown;
  version?: unknown;
  hotspots?: unknown;
};

function resolveRepoRoot() {
  const rootMarker = "pnpm-workspace.yaml";
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), ".."),
    path.resolve(process.cwd(), "../.."),
    path.resolve(process.cwd(), "../../.."),
  ];
  const fileExists = (filePath: string) => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- HBAG-0001 repo root probe uses fixed candidate list
    return existsSync(filePath);
  };
  for (const candidate of candidates) {
    if (
      fileExists(path.join(candidate, "products")) &&
      fileExists(path.join(candidate, rootMarker))
    ) {
      return candidate;
    }
  }
  for (const candidate of candidates) {
    if (fileExists(path.join(candidate, "products"))) {
      return candidate;
    }
  }
  return path.resolve(process.cwd(), "../..");
}

const getHotspotsPath = (productId: string) => {
  const repoRoot = resolveRepoRoot();
  return path.join(repoRoot, "products", productId, "hotspots.json");
};

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ productId: string }>;
  },
) {
  const { productId } = await params;
  if (!SAFE_SEGMENT.test(productId)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const filePath = getHotspotsPath(productId);

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- HBAG-0001 path validated and scoped
    const data = await readFile(filePath, "utf8");
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Hotspots not found" }, { status: 404 });
  }
}

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ productId: string }>;
  },
) {
  const { productId } = await params;
  if (!SAFE_SEGMENT.test(productId)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  let payload: HotspotPayload;
  try {
    payload = (await request.json()) as HotspotPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const hotspots = sanitizeHotspots(payload.hotspots);
  if (!hotspots) {
    return NextResponse.json({ error: "Invalid hotspots payload" }, { status: 400 });
  }

  const responseBody = {
    productId,
    version: typeof payload.version === "string" ? payload.version : "0.1.0",
    hotspots,
  };

  const filePath = getHotspotsPath(productId);
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- HBAG-0001 path validated and scoped
    await writeFile(filePath, `${JSON.stringify(responseBody, null, 2)}\n`, "utf8");
    return NextResponse.json(responseBody, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to save hotspots" }, { status: 500 });
  }
}
