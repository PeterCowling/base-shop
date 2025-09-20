/** @jest-environment node */
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function withRepo(cb: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pages-"));
  const shopDir = path.join(dir, "data", "shops", "test");
  await fs.mkdir(shopDir, { recursive: true });
  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();
  try {
    await cb(dir);
  } finally {
    process.chdir(cwd);
  }
}

function mockAuth() {
  jest.doMock("next-auth", () => ({
    getServerSession: jest.fn().mockResolvedValue({
      user: { role: "admin", email: "admin@example.com" },
    }),
  }));
}

describe("pages API validation", () => {
  afterEach(() => jest.resetAllMocks());

  it("returns 400 when component structure is invalid", async () => {
    await withRepo(async () => {
      mockAuth();
      const route = await import("../src/app/api/page-draft/[shop]/route");
      const fd = new FormData();
      fd.append("components", '[{"id":"c1"}]'); // missing type
      const req = { formData: () => Promise.resolve(fd) } as any;
      const res = await route.POST(req, { params: Promise.resolve({ shop: "test" }) });
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.errors.components[0]).toBe("Invalid components");
    });
  });
});
