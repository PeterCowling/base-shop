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
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await fs.mkdir(templatesDir, { recursive: true });
  for (const [name, data] of Object.entries(files)) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
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

describe("page template by name API route", () => {
  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it("returns template data when found", async () => {
    await withTemplates({ home: { name: "Home", components: ["Hero"] } }, async () => {
      const route = await import("../src/app/api/page-templates/[name]/route");
      const res = await route.GET(new Request("http://localhost"), {
        params: Promise.resolve({ name: "home" }),
      });
      const json = await res.json();
      expect(json).toEqual({ name: "Home", components: ["Hero"] });
    });
  });

  it("returns 404 when template missing", async () => {
    await withTemplates({}, async () => {
      const route = await import("../src/app/api/page-templates/[name]/route");
      const res = await route.GET(new Request("http://localhost"), {
        params: Promise.resolve({ name: "missing" }),
      });
      const json = await res.json();
      expect(res.status).toBe(404);
      expect(json).toEqual({ error: "Not found" });
    });
  });
});
