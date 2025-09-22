import { NextResponse, type NextRequest } from "next/server";
import path from "path";
import { readJsonFile, writeJsonFile, withFileLock } from "@/lib/server/jsonIO";

type VersionEntry = {
  id: string;
  label: string;
  timestamp: string;
  components: unknown[]; // PageComponent[] serialized
  editor?: Record<string, unknown>;
};

type Store = Record<string, Record<string, VersionEntry[]>>; // shop -> pageId -> versions

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
  context: { params: Promise<{ shop: string; pageId: string }> },
) {
  const { shop, pageId } = await context.params;
  const store = await readStore();
  const list = store[shop]?.[pageId] ?? [];
  // Newest first based on insertion order (push appends),
  // which is more stable than relying on timestamps under fast tests.
  const ordered = [...list].reverse();
  return NextResponse.json(ordered);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string; pageId: string }> },
) {
  try {
    const { shop, pageId } = await context.params;
    const body = await req.json();
    const { label, components, editor } = body ?? {};
    if (!label || typeof label !== "string") {
      return NextResponse.json({ error: "label is required" }, { status: 400 });
    }
    if (!Array.isArray(components)) {
      return NextResponse.json({ error: "components must be an array" }, { status: 400 });
    }
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const entry: VersionEntry = {
      id,
      label,
      timestamp: new Date().toISOString(),
      components,
      editor: editor && typeof editor === "object" ? editor : undefined,
    };
    await withFileLock(STORE_PATH, async () => {
      const store = await readStore();
      const byShop = (store[shop] ??= {});
      const list = (byShop[pageId] ??= []);
      list.push(entry);
      await writeStore(store);
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
