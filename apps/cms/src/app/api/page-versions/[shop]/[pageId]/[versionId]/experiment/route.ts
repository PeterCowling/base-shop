import { type NextRequest,NextResponse } from "next/server";
import path from "path";

import { readJsonFile, withFileLock,writeJsonFile } from "@/lib/server/jsonIO";

type Experiment = {
  id: string;
  shop: string;
  pageId: string;
  label?: string;
  createdAt: string;
  variantA: { source: "current" | "version"; versionId?: string };
  variantB: { source: "version"; versionId: string };
  splitA: number; // 0-100
  startAt?: string;
  endAt?: string;
};

type Store = Record<string, Record<string, Experiment[]>>; // shop -> pageId -> experiments

const STORE_PATH = path.join(process.cwd(), "data", "cms", "page-experiments.json");

async function readStore(): Promise<Store> {
  return readJsonFile<Store>(STORE_PATH, {});
}

async function writeStore(store: Store): Promise<void> {
  await writeJsonFile(STORE_PATH, store);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string; pageId: string; versionId: string }> },
) {
  try {
    const { shop, pageId, versionId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const label = typeof body.label === "string" && body.label.trim() ? body.label.trim() : undefined;
    const splitA = typeof body.splitA === "number" ? Math.max(0, Math.min(100, body.splitA)) : 50;
    const startAt = typeof body.startAt === "string" ? body.startAt : undefined;
    const endAt = typeof body.endAt === "string" ? body.endAt : undefined;

    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = new Date().toISOString();
    const exp: Experiment = {
      id,
      shop,
      pageId,
      label,
      createdAt,
      variantA: { source: "current" },
      variantB: { source: "version", versionId },
      splitA,
      startAt,
      endAt,
    };

    await withFileLock(STORE_PATH, async () => {
      const store = await readStore();
      const byShop = (store[shop] ??= {});
      const list = (byShop[pageId] ??= []);
      list.push(exp);
      await writeStore(store);
    });
    return NextResponse.json(exp, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
