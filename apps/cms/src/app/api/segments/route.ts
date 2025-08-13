import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { promises as fs } from "node:fs";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { validateShopName } from "@acme/lib";

interface SegmentDef {
  id: string;
  name: string;
  filters: { field: string; value: string }[];
}

function segmentsPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "segments.json");
}

async function readSegments(shop: string): Promise<SegmentDef[]> {
  try {
    const buf = await fs.readFile(segmentsPath(shop), "utf8");
    const json = JSON.parse(buf);
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

async function writeSegments(shop: string, items: SegmentDef[]): Promise<void> {
  await fs.mkdir(path.dirname(segmentsPath(shop)), { recursive: true });
  await fs.writeFile(segmentsPath(shop), JSON.stringify(items, null, 2), "utf8");
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop) {
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  }
  const segments = await readSegments(shop);
  return NextResponse.json({ segments });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { shop, id, name, filters } = (await req.json().catch(() => ({}))) as {
    shop?: string;
    id?: string;
    name?: string;
    filters?: { field: string; value: string }[];
  };
  if (!shop || !id || !Array.isArray(filters)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const segments = await readSegments(shop);
  const def: SegmentDef = { id, name: name || id, filters };
  const idx = segments.findIndex((s) => s.id === id);
  if (idx >= 0) segments[idx] = def; else segments.push(def);
  await writeSegments(shop, segments);
  return NextResponse.json({ ok: true });
}
