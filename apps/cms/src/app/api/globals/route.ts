import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "fs";
import * as path from "path";
import { DATA_ROOT } from "@acme/platform-core/dataRoot";
import { validateShopName } from "@acme/platform-core/shops";
// Use server translation loader; alias to avoid hooks lint
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";

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
  // Ensure pageId cannot influence directories; restrict to safe chars
  const safeId = (pageId ?? "")
    .toString()
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "");
  const name = safeId.length ? `globals.page.${safeId}.json` : `globals.json`;
  return path.join(base, name);
}

async function ensureDirFor(filePath: string) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-102 Derived from validated inputs and DATA_ROOT
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function readList(shop: string, pageId?: string | null): Promise<GlobalItem[]> {
  try {
    const file = fileFor(shop, pageId);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-102 Read confined to DATA_ROOT with validated segments
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
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-102 Write confined to DATA_ROOT with validated segments
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), "utf8");
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-102 Rename confined to DATA_ROOT with validated segments
  await fs.rename(tmp, file);
}

export async function GET(req: NextRequest) {
  try {
    const t = await getTranslations("en");
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    const pageId = searchParams.get("pageId");
    if (!shop) return NextResponse.json({ error: t("cms.globals.missingShop") }, { status: 400 });
    const list = await readList(shop, pageId);
    return NextResponse.json(list);
  } catch {
    const t = await getTranslations("en");
    return NextResponse.json({ error: t("api.common.invalidRequest") }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const t = await getTranslations("en");
    const { ensureAuthorized } = await import("@cms/actions/common/auth"); // i18n-exempt -- CMS-2134 [ttl=2026-03-31]
    await ensureAuthorized();
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    const pageId = searchParams.get("pageId");
    if (!shop) return NextResponse.json({ error: t("cms.globals.missingShop") }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const cur = await readList(shop, pageId);
    const upsert = (item: GlobalItem) => {
      const idx = cur.findIndex((g) => g.globalId === item.globalId);
      if (idx === -1) cur.unshift(item);
      else cur[idx] = { ...cur[idx], ...item };
    };
    const sanitize = (raw: unknown): GlobalItem | null => {
      if (!raw || typeof raw !== "object") return null;
      const obj = raw as Record<string, unknown>;
      const globalId = typeof obj.globalId === "string" && obj.globalId.length ? obj.globalId : "";
      const label = typeof obj.label === "string" && obj.label.length ? obj.label : t("cms.globals.untitled");
      const createdAt = typeof obj.createdAt === "number" ? obj.createdAt : Date.now();
      const template = (obj as { template?: unknown }).template;
      const tags = Array.isArray(obj.tags) ? obj.tags.filter((t: unknown) => typeof t === "string") : undefined;
      const thumbnail = typeof obj.thumbnail === "string" || obj.thumbnail === null ? (obj.thumbnail as string | null) : undefined;
      const breakpoints = Array.isArray(obj.breakpoints) ? (obj.breakpoints as GlobalItem["breakpoints"]) : undefined;
      try {
        const len = JSON.stringify(template).length;
        if (len > 1_000_000) throw new Error(t("cms.globals.templateTooLarge"));
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
  } catch {
    const t = await getTranslations("en");
    return NextResponse.json({ error: t("api.common.invalidRequest") }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const t = await getTranslations("en");
    const { ensureAuthorized } = await import("@cms/actions/common/auth"); // i18n-exempt -- CMS-2134 [ttl=2026-03-31]
    await ensureAuthorized();
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    const pageId = searchParams.get("pageId");
    if (!shop) return NextResponse.json({ error: t("cms.globals.missingShop") }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const id = String(body.globalId || "");
    const patchIn = (body.patch || {}) as Partial<GlobalItem>;
    const patch: Partial<GlobalItem> = {};
    if (typeof patchIn.label === "string") patch.label = patchIn.label;
    if (Array.isArray(patchIn.tags)) patch.tags = patchIn.tags.filter((t) => typeof t === "string");
    if (typeof patchIn.thumbnail === "string" || patchIn.thumbnail === null) patch.thumbnail = patchIn.thumbnail;
    if (Array.isArray(patchIn.breakpoints)) patch.breakpoints = patchIn.breakpoints;
    if (patchIn.template !== undefined) patch.template = patchIn.template;
    if (!id) return NextResponse.json({ error: t("cms.globals.missingGlobalId") }, { status: 400 });
    const cur = await readList(shop, pageId);
    const idx = cur.findIndex((g) => g.globalId === id);
    if (idx === -1) return NextResponse.json({ error: t("cms.globals.notFound") }, { status: 404 });
    cur[idx] = { ...cur[idx], ...patch } as GlobalItem;
    await writeList(shop, pageId, cur);
    return NextResponse.json(cur[idx]);
  } catch {
    const t = await getTranslations("en");
    return NextResponse.json({ error: t("api.common.invalidRequest") }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const t = await getTranslations("en");
    const { ensureAuthorized } = await import("@cms/actions/common/auth"); // i18n-exempt -- CMS-2134 [ttl=2026-03-31]
    await ensureAuthorized();
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    const pageId = searchParams.get("pageId");
    if (!shop) return NextResponse.json({ error: t("cms.globals.missingShop") }, { status: 400 });
    const id = searchParams.get("id");
    const clearAll = searchParams.get("all");
    if (clearAll === "1") {
      await writeList(shop, pageId, []);
      return NextResponse.json({ ok: true });
    }
    if (!id) return NextResponse.json({ error: t("cms.globals.missingId") }, { status: 400 });
    const cur = await readList(shop, pageId);
    const next = cur.filter((g) => g.globalId !== id);
    await writeList(shop, pageId, next);
    return NextResponse.json({ ok: true });
  } catch {
    const t = await getTranslations("en");
    return NextResponse.json({ error: t("api.common.invalidRequest") }, { status: 400 });
  }
}
