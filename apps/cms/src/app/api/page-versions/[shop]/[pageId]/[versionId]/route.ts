import { NextResponse, type NextRequest } from "next/server";
import path from "path";
import { readJsonFile, writeJsonFile, withFileLock } from "@/lib/server/jsonIO";

type VersionEntry = {
  id: string;
  label: string;
  timestamp: string;
  components: unknown[];
  editor?: Record<string, unknown>;
};

type Store = Record<string, Record<string, VersionEntry[]>>;

const STORE_BASE = process.env.DATA_ROOT
  ? path.join(process.env.DATA_ROOT, "..", "cms")
  : path.join(process.cwd(), "data", "cms");
const STORE_PATH = path.join(STORE_BASE, "page-versions.json");

async function readStore(): Promise<Store> {
  return readJsonFile<Store>(STORE_PATH, {});
}

async function writeStore(store: Store): Promise<void> {
  await writeJsonFile(STORE_PATH, store);
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ shop: string; pageId: string; versionId: string }> },
) {
  const { shop, pageId, versionId } = await context.params;
  const store = await readStore();
  const list = store[shop]?.[pageId] ?? [];
  const v = list.find((e) => e.id === versionId);
  if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(v);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ shop: string; pageId: string; versionId: string }> },
) {
  try {
    const { shop, pageId, versionId } = await context.params;
    const body = await req.json();
    const { label } = body ?? {};
    if (!label || typeof label !== "string") {
      return NextResponse.json({ error: "label is required" }, { status: 400 });
    }
    let updated: VersionEntry | undefined;
    await withFileLock(STORE_PATH, async () => {
      const store = await readStore();
      const list = store[shop]?.[pageId];
      if (!list) throw new Error("Not found");
      const idx = list.findIndex((e) => e.id === versionId);
      if (idx === -1) throw new Error("Not found");
      list[idx] = { ...list[idx], label };
      await writeStore(store);
      updated = list[idx];
    });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ shop: string; pageId: string; versionId: string }> },
) {
  try {
    const { shop, pageId, versionId } = await context.params;
    await withFileLock(STORE_PATH, async () => {
      const store = await readStore();
      const list = store[shop]?.[pageId];
      if (!list) return;
      const next = list.filter((e) => e.id !== versionId);
      if (store[shop]) store[shop][pageId] = next;
      await writeStore(store);
    });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
