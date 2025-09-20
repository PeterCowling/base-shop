import { NextRequest } from "next/server";

const mem: { data?: any } = {};
jest.mock("@/lib/server/jsonIO", () => ({
  readJsonFile: jest.fn(async (_f: string, fallback: any) => mem.data ?? fallback),
  writeJsonFile: jest.fn(async (_f: string, v: any) => { mem.data = v; }),
  withFileLock: jest.fn(async (_f: string, fn: () => Promise<any>) => fn()),
}));

let GET_ONE: typeof import("../route").GET;
let PATCH_ONE: typeof import("../route").PATCH;
let DELETE_ONE: typeof import("../route").DELETE;
let POST_VERSION: typeof import("../../route").POST;

beforeAll(async () => {
  ({ GET: GET_ONE, PATCH: PATCH_ONE, DELETE: DELETE_ONE } = await import("../route"));
  ({ POST: POST_VERSION } = await import("../../route"));
});

beforeEach(() => { mem.data = undefined; jest.clearAllMocks(); });

function req(method: string, body?: unknown) {
  return new NextRequest("http://test.local", {
    method,
    body: body == null ? undefined : JSON.stringify(body),
    headers: body == null ? undefined : { "content-type": "application/json" },
  });
}

describe("page-versions item API", () => {
  it("renames and deletes an entry", async () => {
    const ctx = { params: Promise.resolve({ shop: "s1", pageId: "p1" }) } as any;
    const createdRes = await POST_VERSION(req("POST", { label: "first", components: [] }), ctx);
    const created = await createdRes.json();
    const id = created.id as string;
    const itemCtx = { params: Promise.resolve({ shop: "s1", pageId: "p1", versionId: id }) } as any;

    const getRes = await GET_ONE(req("GET"), itemCtx);
    await expect(getRes.json()).resolves.toEqual(expect.objectContaining({ label: "first" }));

    const patchRes = await PATCH_ONE(req("PATCH", { label: "renamed" }), itemCtx);
    await expect(patchRes.json()).resolves.toEqual(expect.objectContaining({ label: "renamed" }));

    const delRes = await DELETE_ONE(req("DELETE"), itemCtx);
    expect(delRes.status).toBe(204);
  });
});

