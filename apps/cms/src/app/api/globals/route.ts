import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "fs";
import * as path from "path";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { validateShopName } from "@platform-core/shops";

type GlobalItem = {
  globalId: string;
  label: string;
  createdAt: number;
  template: unknown;
  tags?: string[];
  thumbnail?: string | null;
  breakpoints?: { id: string; label: string; min?: number; max?: number }[];
};

function fileFor(shop: string, pageId?: string | null) {
  const base = path.join(DATA_ROOT, validateShopName(shop));
  const name = pageId && pageId.length ? `globals.page.${pageId}.json` : `globals.json`;
  return path.join(base, name);
}

async function ensureDirFor(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function readList(shop: string, pageId?: string | null): Promise<GlobalItem[]> {
  try {
    const file = fileFor(shop, pageId);
    const buf = await fs.readFile(file, "utf8");
    const json = JSON.parse(buf);
    return Array.isArray(json) ? (json as GlobalItem[]) : [];
  } catch {
    return [];
  }
}

async function writeList(shop: string, pageId: string | null | undefined, list: GlobalItem[]) {
  const file = fileFor(shop, pageId || undefined);
  await ensureDirFor(file);
  const tmp = `${file}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), "utf8");
  await fs.rename(tmp, file);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    const pageId = searchParams.get("pageId");
    if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });
    const list = await readList(shop, pageId);
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ensureAuthorized } = await import("@cms/actions/common/auth");
    await ensureAuthorized();
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    const pageId = searchParams.get("pageId");
    if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const cur = await readList(shop, pageId);
    const upsert = (item: GlobalItem) => {
      const idx = cur.findIndex((g) => g.globalId === item.globalId);
      if (idx === -1) cur.unshift(item);
      else cur[idx] = { ...cur[idx], ...item };
    };
    const sanitize = (raw: any): GlobalItem | null => {
      if (!raw || typeof raw !== "object") return null;
      const globalId = typeof raw.globalId === "string" && raw.globalId.length ? raw.globalId : "";
      const label = typeof raw.label === "string" && raw.label.length ? raw.label : "Untitled";
      const createdAt = typeof raw.createdAt === "number" ? raw.createdAt : Date.now();
      const template = raw.template;
      const tags = Array.isArray(raw.tags) ? raw.tags.filter((t: unknown) => typeof t === "string") : undefined;
      const thumbnail = typeof raw.thumbnail === "string" || raw.thumbnail === null ? raw.thumbnail : undefined;
      const breakpoints = Array.isArray(raw.breakpoints) ? raw.breakpoints : undefined;
      try {
        const len = JSON.stringify(template).length;
        if (len > 1_000_000) throw new Error("Template too large");
      } catch {
        // ignore
      }
      if (!globalId) return null;
      return { globalId, label, createdAt, template, tags, thumbnail, breakpoints } as GlobalItem;
    };
    if (Array.isArray(body.items)) (body.items as unknown[]).forEach((i) => { const s = sanitize(i); if (s) upsert(s); });
    if (body.item) { const s = sanitize(body.item); if (s) upsert(s); }
    await writeList(shop, pageId, cur);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { ensureAuthorized } = await import("@cms/actions/common/auth");
    await ensureAuthorized();
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    const pageId = searchParams.get("pageId");
    if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const id = String(body.globalId || "");
    const patchIn = (body.patch || {}) as Partial<GlobalItem>;
    const patch: Partial<GlobalItem> = {};
    if (typeof patchIn.label === "string") patch.label = patchIn.label;
    if (Array.isArray(patchIn.tags)) patch.tags = patchIn.tags.filter((t) => typeof t === "string");
    if (typeof patchIn.thumbnail === "string" || patchIn.thumbnail === null) patch.thumbnail = patchIn.thumbnail;
    if (Array.isArray(patchIn.breakpoints)) patch.breakpoints = patchIn.breakpoints;
    if (patchIn.template !== undefined) patch.template = patchIn.template;
    if (!id) return NextResponse.json({ error: "Missing globalId" }, { status: 400 });
    const cur = await readList(shop, pageId);
    const idx = cur.findIndex((g) => g.globalId === id);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    cur[idx] = { ...cur[idx], ...patch } as GlobalItem;
    await writeList(shop, pageId, cur);
    return NextResponse.json(cur[idx]);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { ensureAuthorized } = await import("@cms/actions/common/auth");
    await ensureAuthorized();
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    const pageId = searchParams.get("pageId");
    if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });
    const id = searchParams.get("id");
    const clearAll = searchParams.get("all");
    if (clearAll === "1") {
      await writeList(shop, pageId, []);
      return NextResponse.json({ ok: true });
    }
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const cur = await readList(shop, pageId);
    const next = cur.filter((g) => g.globalId !== id);
    await writeList(shop, pageId, next);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
