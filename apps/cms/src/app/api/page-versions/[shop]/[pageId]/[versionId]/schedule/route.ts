import { NextResponse, type NextRequest } from "next/server";
import path from "path";
import { readJsonFile, writeJsonFile, withFileLock } from "@/lib/server/jsonIO";

type Schedule = {
  id: string;
  shop: string;
  pageId: string;
  versionId: string;
  publishAt: string; // ISO
  createdAt: string;
};

type Store = Record<string, Record<string, Schedule[]>>; // shop -> pageId -> schedules

const STORE_PATH = path.join(process.cwd(), "data", "cms", "page-schedules.json");

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
    const publishAt = typeof body.publishAt === "string" ? body.publishAt : undefined;
    if (!publishAt) {
      return NextResponse.json({ error: "publishAt is required (ISO string)" }, { status: 400 });
    }
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = new Date().toISOString();
    const schedule: Schedule = { id, shop, pageId, versionId, publishAt, createdAt };

    await withFileLock(STORE_PATH, async () => {
      const store = await readStore();
      const byShop = (store[shop] ??= {});
      const list = (byShop[pageId] ??= []);
      list.push(schedule);
      await writeStore(store);
    });
    return NextResponse.json(schedule, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
