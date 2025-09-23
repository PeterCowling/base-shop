import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

let GET: typeof import("../route").GET;
let POST: typeof import("../route").POST;
let PATCH: typeof import("../route").PATCH;
let DELETE: typeof import("../route").DELETE;

describe("globals route", () => {
  let tmpRoot: string;

  beforeAll(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "globals-api-"));
    jest.doMock("@platform-core/dataRoot", () => ({ DATA_ROOT: tmpRoot }));
    ({ GET, POST, PATCH, DELETE } = await import("../route"));
  });

  afterAll(async () => {
    try { await fs.rm(tmpRoot, { recursive: true, force: true }); } catch {}
  });

  it("GET 400 when shop missing", async () => {
    const res = await GET(new Request("http://test/api/globals"));
    expect(res.status).toBe(400);
  });

  it("POST/GET/PATCH/DELETE lifecycle", async () => {
    const shop = "s1";
    const item = { globalId: "g1", label: "Hero", createdAt: Date.now(), template: { id: "x", type: "Section" } };

    // create
    let res = await POST(new Request(`http://test/api/globals?shop=${shop}`, { method: "POST", body: JSON.stringify({ item }) }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });

    // read
    res = await GET(new Request(`http://test/api/globals?shop=${shop}`));
    expect(res.status).toBe(200);
    const list = (await res.json()) as any[];
    expect(list.length).toBe(1);
    expect(list[0].globalId).toBe("g1");

    // patch
    res = await PATCH(new Request(`http://test/api/globals?shop=${shop}`, { method: "PATCH", body: JSON.stringify({ globalId: "g1", patch: { label: "Hero A" } }) }));
    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.label).toBe("Hero A");

    // delete
    res = await DELETE(new Request(`http://test/api/globals?shop=${shop}&id=g1`, { method: "DELETE" }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });

    // empty
    res = await GET(new Request(`http://test/api/globals?shop=${shop}`));
    const after = (await res.json()) as any[];
    expect(after.length).toBe(0);
  });
});

