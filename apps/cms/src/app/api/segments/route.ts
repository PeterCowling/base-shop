import "@acme/zod-utils/initZod";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { validateShopName } from "@acme/lib";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";
import { segmentSchema, type Segment } from "@acme/types";

function segmentsPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "segments.json");
}

async function readSegments(shop: string): Promise<Segment[]> {
  try {
    const buf = await fs.readFile(segmentsPath(shop), "utf8");
    const json = JSON.parse(buf);
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

async function writeSegments(shop: string, items: Segment[]): Promise<void> {
  await fs.mkdir(path.dirname(segmentsPath(shop)), { recursive: true });
  await fs.writeFile(segmentsPath(shop), JSON.stringify(items, null, 2), "utf8");
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const shopParam = req.nextUrl.searchParams.get("shop");
  const parsed = z.string().min(1).safeParse(shopParam);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  }
  const segments = await readSegments(parsed.data);
  return NextResponse.json({ segments });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const parsed = await parseJsonBody(
    req as any,
    segmentSchema.extend({ shop: z.string() }),
    "1mb",
  );
  if (parsed.success === false) return parsed.response;
  const { shop, id, name, filters } = parsed.data;
  const segments = await readSegments(shop);
  const def: Segment = { id, name: name ?? id, filters };
  const idx = segments.findIndex((s) => s.id === id);
  if (idx >= 0) segments[idx] = def;
  else segments.push(def);
  await writeSegments(shop, segments);
  return NextResponse.json({ ok: true });
}
