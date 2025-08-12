import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function withTempDir(cb: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "rbac-"));
  const spy = jest.spyOn(process, "cwd").mockReturnValue(dir);
  jest.resetModules();
  try {
    await cb(dir);
  } finally {
    spy.mockRestore();
  }
}

afterEach(() => jest.resetAllMocks());

describe("rbacStore", () => {
  it("readRbac returns defaults when file missing", async () => {
    await withTempDir(async () => {
      const { readRbac } = await import("../src/lib/rbacStore");
      const db = await readRbac();
      expect(db.users["1"].email).toBe("admin@example.com");
      expect(db.roles["1"]).toBe("admin");
      expect(db.permissions.admin).toEqual([]);
    });
  });

  it("writeRbac persists modified db", async () => {
    await withTempDir(async (dir) => {
      const { readRbac, writeRbac } = await import("../src/lib/rbacStore");
      const db = await readRbac();
      db.users["6"] = {
        id: "6",
        name: "Temp",
        email: "temp@example.com",
        password: "pw",
      };
      db.roles["6"] = "viewer";
      db.permissions.viewer.push("test-perm");
      await writeRbac(db);
      const stored = JSON.parse(
        await fs.readFile(path.join(dir, "data", "cms", "users.json"), "utf8")
      );
      expect(stored).toEqual(db);
    });
  });
});
