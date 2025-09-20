import { NextResponse, type NextRequest } from "next/server";
import path from "path";
import { readJsonFile, writeJsonFile, withFileLock } from "@/lib/server/jsonIO";

export type CommentMessage = {
  id: string;
  text: string;
  author?: string;
  ts: string;
};

export type CommentThread = {
  id: string;
  shop: string;
  pageId: string;
  componentId: string;
  resolved: boolean;
  assignedTo?: string | null;
  messages: CommentMessage[];
  /** Optional pin position relative to the component (0..1) */
  pos?: { x: number; y: number } | null;
  createdAt: string;
  updatedAt: string;
};

type Store = Record<string, Record<string, CommentThread[]>>; // shop -> pageId -> threads

const STORE_PATH = path.join(process.cwd(), "data", "cms", "comments.json");

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
  const threads = store[shop]?.[pageId] ?? [];
  return NextResponse.json(threads);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string; pageId: string }> },
) {
  try {
    const { shop, pageId } = await context.params;
    const body = await req.json();
    const { componentId, text, assignedTo, pos } = body ?? {};
    if (!componentId || typeof componentId !== "string") {
      return NextResponse.json({ error: "componentId is required" }, { status: 400 });
    }
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    const now = new Date().toISOString();
    const threadId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const msgId = `${Math.random().toString(36).slice(2, 10)}`;
    const thread: CommentThread = {
      id: threadId,
      shop,
      pageId,
      componentId,
      resolved: false,
      assignedTo: assignedTo ?? null,
      messages: [{ id: msgId, text, ts: now }],
      pos: pos && typeof pos.x === "number" && typeof pos.y === "number" ? { x: Number(pos.x), y: Number(pos.y) } : null,
      createdAt: now,
      updatedAt: now,
    };
    await withFileLock(STORE_PATH, async () => {
      const store = await readStore();
      const byShop = (store[shop] ??= {});
      const list = (byShop[pageId] ??= []);
      list.push(thread);
      await writeStore(store);
    });
    return NextResponse.json(thread, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
