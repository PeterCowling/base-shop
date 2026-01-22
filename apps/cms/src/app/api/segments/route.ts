import "@acme/zod-utils/initZod";

import { type NextRequest, NextResponse } from "next/server";
import { ensureShopAccess, ensureShopReadAccess } from "@cms/actions/common/auth";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

import { validateShopName } from "@acme/lib";
import { parseJsonBody } from "@acme/lib/http/server";
import { DATA_ROOT } from "@acme/platform-core/dataRoot";
import { type Segment,segmentSchema } from "@acme/types";

import { writeJsonFile } from "@/lib/server/jsonIO";

function segmentsPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "segments.json");
}

async function readSegments(shop: string): Promise<Segment[]> {
  try {
    // Constrained to validated shop data directory
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-2651: path is restricted to DATA_ROOT + validated shop
    const buf = await fs.readFile(segmentsPath(shop), "utf8");
    const json = JSON.parse(buf);
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

async function writeSegments(shop: string, items: Segment[]): Promise<void> {
  await writeJsonFile(segmentsPath(shop), items);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const shopParam = req.nextUrl.searchParams.get("shop");
  const parsed = z.string().min(1).safeParse(shopParam);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  }
  const shop = parsed.data;
  try {
    await ensureShopReadAccess(shop);
  } catch (err) {
    const message = (err as Error).message;
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message === "Forbidden" ? "Forbidden" : "Unauthorized" }, { status });
  }
  const segments = await readSegments(shop);
  return NextResponse.json({ segments });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const parsed = await parseJsonBody(
    req,
    segmentSchema.extend({ shop: z.string() }),
    "1mb",
  );
  if (parsed.success === false) return parsed.response;
  const { shop, id, name, filters } = parsed.data;
  try {
    await ensureShopAccess(shop);
  } catch (err) {
    const message = (err as Error).message;
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message === "Forbidden" ? "Forbidden" : "Unauthorized" }, { status });
  }
  const segments = await readSegments(shop);
  const def: Segment = { id, name: name ?? id, filters };
  const idx = segments.findIndex((s) => s.id === id);
  if (idx >= 0) segments[idx] = def;
  else segments.push(def);
  await writeSegments(shop, segments);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const shopParam = req.nextUrl.searchParams.get("shop");
  const idParam = req.nextUrl.searchParams.get("id");
  const shopParsed = z.string().min(1).safeParse(shopParam);
  if (!shopParsed.success) {
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  }
  const shop = shopParsed.data;
  try {
    await ensureShopAccess(shop);
  } catch (err) {
    const message = (err as Error).message;
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message === "Forbidden" ? "Forbidden" : "Unauthorized" }, { status });
  }
  const idParsed = z.string().min(1).safeParse(idParam);
  if (!idParsed.success) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const segments = await readSegments(shop);
  const idx = segments.findIndex((s) => s.id === idParsed.data);
  if (idx >= 0) {
    segments.splice(idx, 1);
    await writeSegments(shop, segments);
  }
  return NextResponse.json({ ok: true });
}
