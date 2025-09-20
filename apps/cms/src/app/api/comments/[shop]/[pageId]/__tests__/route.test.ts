import { NextRequest } from "next/server";

// Mock JSON IO with in-memory store and no real file system
const mem: { data?: any } = {};
jest.mock("@/lib/server/jsonIO", () => ({
  readJsonFile: jest.fn(async (_f: string, fallback: any) => mem.data ?? fallback),
  writeJsonFile: jest.fn(async (_f: string, v: any) => {
    mem.data = v;
  }),
  withFileLock: jest.fn(async (_f: string, fn: () => Promise<any>) => fn()),
}));

let COMMENTS_GET: typeof import("../route").GET;
let COMMENTS_POST: typeof import("../route").POST;
let THREAD_PATCH: typeof import("../[commentId]/route").PATCH;
let THREAD_DELETE: typeof import("../[commentId]/route").DELETE;

beforeAll(async () => {
  ({ GET: COMMENTS_GET, POST: COMMENTS_POST } = await import("../route"));
  ({ PATCH: THREAD_PATCH, DELETE: THREAD_DELETE } = await import("../[commentId]/route"));
});

beforeEach(() => {
  mem.data = undefined;
  jest.clearAllMocks();
});

function req(method: string, body?: unknown) {
  return new NextRequest("http://test.local", {
    method,
    body: body == null ? undefined : JSON.stringify(body),
    headers: body == null ? undefined : { "content-type": "application/json" },
  });
}

describe("comments API", () => {
  it("lists empty threads then creates, updates and deletes a thread", async () => {
    const ctx = { params: Promise.resolve({ shop: "s1", pageId: "p1" }) } as any;

    // Initially empty
    const resEmpty = await COMMENTS_GET(req("GET"), ctx);
    await expect(resEmpty.json()).resolves.toEqual([]);

    // Create
    const createdRes = await COMMENTS_POST(
      req("POST", { componentId: "c1", text: "Hello", assignedTo: "u1" }),
      ctx,
    );
    expect(createdRes.status).toBe(201);
    const created = await createdRes.json();
    expect(created.componentId).toBe("c1");
    const id = created.id as string;

    // List shows one
    const resOne = await COMMENTS_GET(req("GET"), ctx);
    const list = await resOne.json();
    expect(list).toHaveLength(1);

    // Add message + resolve
    const patchCtx = { params: Promise.resolve({ shop: "s1", pageId: "p1", commentId: id }) } as any;
    await THREAD_PATCH(req("PATCH", { action: "addMessage", text: "Reply" }), patchCtx);
    const resolvedRes = await THREAD_PATCH(req("PATCH", { resolved: true }), patchCtx);
    const updated = await resolvedRes.json();
    expect(updated.resolved).toBe(true);
    expect(updated.messages).toHaveLength(2);

    // Delete
    const del = await THREAD_DELETE(req("DELETE"), patchCtx);
    expect(del.status).toBe(204);
    const resAfter = await COMMENTS_GET(req("GET"), ctx);
    await expect(resAfter.json()).resolves.toEqual([]);
  });
});

