/* eslint-disable security/detect-non-literal-fs-filename -- CMS-0001 [ttl=2026-12-31] test writes temp fixtures */
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

describe("/uploads/[shop]/[filename]", () => {
  const origDataRoot = process.env.DATA_ROOT;
  let tmpRoot: string | undefined;

  beforeEach(async () => {
    jest.resetModules();
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cms-uploads-"));
    process.env.DATA_ROOT = tmpRoot;
    await fs.mkdir(path.join(tmpRoot, "demo", "uploads"), { recursive: true });
  });

  afterEach(async () => {
    jest.resetModules();
    if (origDataRoot === undefined) delete process.env.DATA_ROOT;
    else process.env.DATA_ROOT = origDataRoot;
    if (tmpRoot) {
      await fs.rm(tmpRoot, { recursive: true, force: true });
      tmpRoot = undefined;
    }
  });

  it("serves an uploaded file from the data root", async () => {
    const payload = Buffer.from("hello");
    await fs.writeFile(path.join(tmpRoot!, "demo", "uploads", "file.txt"), payload);

    const { GET } = await import("../route");
    const res = await GET(new Request("http://localhost/uploads/demo/file.txt"), {
      params: Promise.resolve({ shop: "demo", filename: "file.txt" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/octet-stream");
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf).toEqual(payload);
  });

  it("returns 404 when the file is missing", async () => {
    const { GET } = await import("../route");
    const res = await GET(new Request("http://localhost/uploads/demo/missing.png"), {
      params: Promise.resolve({ shop: "demo", filename: "missing.png" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 for invalid params", async () => {
    const { GET } = await import("../route");
    const res = await GET(new Request("http://localhost/uploads/demo/.."), {
      params: Promise.resolve({ shop: "demo", filename: ".." }),
    });
    expect(res.status).toBe(404);
  });
});
