import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

jest.setTimeout(20000);

// NextResponse.json relies on the static Response.json API, which cross-fetch
// does not provide. Polyfill it when missing.
if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers || {}) },
    });
}

/** Create a temp repo with cwd set, run cb, then restore */
async function withTempRepo(cb: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pl-"));
  await fs.mkdir(path.join(dir, "data"), { recursive: true });
  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();
  try {
    await cb(dir);
  } finally {
    process.chdir(cwd);
  }
}

describe("publish locations API route", () => {
  it("returns file contents and handles missing file", async () => {
    await withTempRepo(async (dir) => {
      const locations = [
        {
          id: "hero",
          name: "Hero",
          path: "hero",
          requiredOrientation: "landscape",
        },
      ];
      const file = path.join(dir, "data", "publish-locations.json");
      await fs.writeFile(file, JSON.stringify(locations), "utf8");

      const route = await import("../src/app/api/publish-locations/route");

      let res = await route.GET();
      let json = await res.json();
      expect(json).toEqual(locations);

      await fs.unlink(file);

      res = await route.GET();
      json = await res.json();
      expect(json).toEqual({ error: expect.any(String) });
      expect(res.status).toBe(404);
    });
  });
});
