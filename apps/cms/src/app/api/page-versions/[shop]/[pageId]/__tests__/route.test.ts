import { NextRequest } from "next/server";

// Mock JSON IO with in-memory store
const mem: { data?: any } = {};
jest.mock("@/lib/server/jsonIO", () => ({
  readJsonFile: jest.fn(async (_f: string, fallback: any) => mem.data ?? fallback),
  writeJsonFile: jest.fn(async (_f: string, v: any) => {
    mem.data = v;
  }),
  withFileLock: jest.fn(async (_f: string, fn: () => Promise<any>) => fn()),
}));

let GET_VERSIONS: typeof import("../route").GET;
let POST_VERSION: typeof import("../route").POST;

beforeAll(async () => {
  ({ GET: GET_VERSIONS, POST: POST_VERSION } = await import("../route"));
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

describe("page-versions API", () => {
  it("lists empty, creates a version, and orders newest first", async () => {
    const ctx = { params: Promise.resolve({ shop: "s1", pageId: "p1" }) } as any;
    const resEmpty = await GET_VERSIONS(req("GET"), ctx);
    await expect(resEmpty.json()).resolves.toEqual([]);

    const v1 = await POST_VERSION(
      req("POST", { label: "first", components: [{ id: "a", type: "Text" }] }),
      ctx,
    );
    expect(v1.status).toBe(201);

    // wait a moment then add second version to ensure ordering
    const v2 = await POST_VERSION(
      req("POST", { label: "second", components: [{ id: "b", type: "Text" }] }),
      ctx,
    );
    expect(v2.status).toBe(201);

    const resList = await GET_VERSIONS(req("GET"), ctx);
    const list = (await resList.json()) as any[];
    expect(list).toHaveLength(2);
    expect(list[0].label).toBe("second");
    expect(list[1].label).toBe("first");
  });
});

