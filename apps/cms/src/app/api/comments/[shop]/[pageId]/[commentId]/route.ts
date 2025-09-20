import { NextResponse, type NextRequest } from "next/server";
import path from "path";
import { readJsonFile, writeJsonFile, withFileLock } from "@/lib/server/jsonIO";

type Message = { id: string; text: string; ts: string; author?: string };
type Thread = {
  id: string;
  shop: string;
  pageId: string;
  componentId: string;
  resolved: boolean;
  assignedTo?: string | null;
  messages: Message[];
  pos?: { x: number; y: number } | null;
  createdAt: string;
  updatedAt: string;
};

type Store = Record<string, Record<string, Thread[]>>; // shop -> pageId -> threads
const STORE_PATH = path.join(process.cwd(), "data", "cms", "comments.json");

async function readStore(): Promise<Store> {
  return readJsonFile<Store>(STORE_PATH, {});
}

async function writeStore(store: Store): Promise<void> {
  await writeJsonFile(STORE_PATH, store);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ shop: string; pageId: string; commentId: string }> },
) {
  try {
    const { shop, pageId, commentId } = await context.params;
    const body = await req.json();
    const { action, text, resolved, assignedTo, pos } = body ?? {};

    let updated: Thread | undefined;
    await withFileLock(STORE_PATH, async () => {
      const store = await readStore();
      const list = store[shop]?.[pageId];
      if (!list) throw new Error("thread not found");
      const idx = list.findIndex((t) => t.id === commentId);
      if (idx === -1) throw new Error("thread not found");
      const thread = list[idx];
      const now = new Date().toISOString();
      if (action === "addMessage") {
        if (!text || typeof text !== "string") throw new Error("text required");
        thread.messages.push({ id: Math.random().toString(36).slice(2, 10), text, ts: now });
        thread.updatedAt = now;
      } else {
        if (typeof resolved === "boolean") thread.resolved = resolved;
        if (assignedTo !== undefined) thread.assignedTo = assignedTo;
        if (pos && typeof pos.x === "number" && typeof pos.y === "number") thread.pos = { x: Number(pos.x), y: Number(pos.y) };
        thread.updatedAt = now;
      }
      list[idx] = thread;
      await writeStore(store);
      updated = thread;
    });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ shop: string; pageId: string; commentId: string }> },
) {
  try {
    const { shop, pageId, commentId } = await context.params;
    await withFileLock(STORE_PATH, async () => {
      const store = await readStore();
      const list = store[shop]?.[pageId];
      if (!list) return;
      const next = list.filter((t) => t.id !== commentId);
      if (store[shop]) {
        store[shop][pageId] = next;
      }
      await writeStore(store);
    });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
