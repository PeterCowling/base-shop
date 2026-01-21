import { NextRequest } from "next/server";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

let GET: typeof import("../route").GET;
let POST: typeof import("../route").POST;
let PATCH: typeof import("../route").PATCH;
let DELETE: typeof import("../route").DELETE;

const req = (url: string, init?: RequestInit) => new NextRequest(url, init as any);

describe("sections route", () => {
  let tmpRoot: string;

  beforeAll(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sections-api-"));
    jest.doMock("@acme/platform-core/dataRoot", () => ({ DATA_ROOT: tmpRoot }));
    jest.doMock("@cms/actions/common/auth", () => ({ ensureAuthorized: jest.fn().mockResolvedValue({ user: { email: "t@test" } }) }));
    ({ GET, POST, PATCH, DELETE } = await import("../route"));
  });

  afterAll(async () => {
    try { await fs.rm(tmpRoot, { recursive: true, force: true }); } catch {}
  });

  it("GET returns array (empty)", async () => {
    const res = await GET(req("http://test/api/sections/s1"), { params: Promise.resolve({ shop: "s1" }) } as any);
    expect(res.status).toBe(200);
    const list = await res.json();
    expect(Array.isArray(list)).toBe(true);
  });

  it("POST creates and lifecycle works", async () => {
    const shop = "s1";
    const body = { label: "Hero", template: { id: "x", type: "Section", children: [] } };
    let res = await POST(req("http://test/api/sections/s1", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), { params: Promise.resolve({ shop }) } as any) as any;
    expect(res.status).toBe(201);
    const created = await res.json();
    expect(created.label).toBe("Hero");
    const id = created.id as string;

    res = await GET(req("http://test/api/sections/s1"), { params: Promise.resolve({ shop }) } as any) as any;
    const list = await res.json();
    expect(list.find((x: any) => x.id === id)).toBeTruthy();

    // update
    res = await PATCH(req("http://test/api/sections/s1", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, label: "Hero A" }) }), { params: Promise.resolve({ shop }) } as any) as any;
    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.label).toBe("Hero A");

    // delete
    res = await DELETE(req(`http://test/api/sections/s1?id=${id}`, { method: "DELETE" }), { params: Promise.resolve({ shop }) } as any) as any;
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});

