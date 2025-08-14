// apps/shop-abc/__tests__/edit-changes.test.ts
import path from "node:path";
import { promises as fs } from "node:fs";

if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

describe("/api/edit-changes", () => {
  const appDir = path.join(__dirname, "..");
  const filePath = path.join(appDir, "edit-changes.json");
  let cwd: string;

  beforeEach(() => {
    cwd = process.cwd();
    process.chdir(appDir);
  });

  afterEach(async () => {
    process.chdir(cwd);
    jest.resetModules();
    try {
      await fs.unlink(filePath);
    } catch {}
  });

  test("returns components and pages for authorized requests", async () => {
    await fs.writeFile(
      filePath,
      JSON.stringify({
        components: [
          {
            file: "molecules/Breadcrumbs.tsx",
            componentName: "Breadcrumbs",
            oldChecksum: "old1",
            newChecksum: "new1",
          },
          {
            file: "atoms/Button.tsx",
            componentName: "Button",
            oldChecksum: "same",
            newChecksum: "same",
          },
        ],
        pages: ["page1", "page2"],
      })
    );
    jest.doMock("@auth", () => ({
      __esModule: true,
      requirePermission: jest.fn(),
    }));
    const { GET } = await import("../src/app/api/edit-changes/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      components: [
        {
          file: "molecules/Breadcrumbs.tsx",
          componentName: "Breadcrumbs",
          oldChecksum: "old1",
          newChecksum: "new1",
        },
      ],
      pages: ["page1", "page2"],
    });
  });

  test("returns 401 for unauthorized", async () => {
    jest.doMock("@auth", () => ({
      __esModule: true,
      requirePermission: jest.fn().mockRejectedValue(new Error("no")),
    }));
    const { GET } = await import("../src/app/api/edit-changes/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });
});
