import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

jest.setTimeout(20000);

async function withTemplates(
  files: Record<string, unknown>,
  cb: () => Promise<void>
): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pt-"));
  const templatesDir = path.join(dir, "packages", "ui", "components", "templates");
  await fs.mkdir(templatesDir, { recursive: true });
  for (const [name, data] of Object.entries(files)) {
    await fs.writeFile(
      path.join(templatesDir, `${name}.json`),
      JSON.stringify(data),
      "utf8"
    );
  }
  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();
  try {
    await cb();
  } finally {
    process.chdir(cwd);
  }
}

describe("page templates list API route", () => {
  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it("returns template list", async () => {
    await withTemplates(
      {
        home: { name: "Home", components: ["Hero"] },
        contact: { components: [] },
      },
      async () => {
        const route = await import("../src/app/api/page-templates/route");
        const res = await route.GET();
        const json = await res.json();
        expect(json).toHaveLength(2);
        expect(json).toEqual(
          expect.arrayContaining([
            { name: "Home", components: ["Hero"] },
            { name: "contact", components: [] },
          ])
        );
      }
    );
  });

  it("handles fs errors", async () => {
    await withTemplates({}, async () => {
      jest.doMock("fs", () => {
        const actual = jest.requireActual("fs");
        return {
          ...actual,
          promises: {
            ...actual.promises,
            readdir: jest.fn().mockRejectedValue(new Error("boom")),
          },
        } as typeof actual;
      });
      const route = await import("../src/app/api/page-templates/route");
      const res = await route.GET();
      const json = await res.json();
      expect(res.status).toBe(500);
      expect(json).toEqual({ error: "boom" });
    });
  });

  it("handles file read errors", async () => {
    await withTemplates({ home: {} }, async () => {
      jest.doMock("fs", () => {
        const actual = jest.requireActual("fs");
        return {
          ...actual,
          promises: {
            ...actual.promises,
            readFile: jest.fn().mockRejectedValue(new Error("fail")),
          },
        } as typeof actual;
      });
      const route = await import("../src/app/api/page-templates/route");
      const res = await route.GET();
      const json = await res.json();
      expect(res.status).toBe(500);
      expect(json).toEqual({ error: "fail" });
    });
  });
});
