import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ROLE_PERMISSIONS } from "@auth/permissions";
import { PERMISSIONS } from "@auth/types/permissions";

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
      const { readRbac } = await import("../src/lib/server/rbacStore");
      const db = await readRbac();
      expect(db.users["1"].email).toBe("admin@example.com");
      expect(db.roles["1"]).toBe("admin");
      expect(db.permissions.admin).toEqual(ROLE_PERMISSIONS.admin);
    });
  });

  it("writeRbac persists modified db", async () => {
    await withTempDir(async (dir) => {
      const { readRbac, writeRbac } = await import("../src/lib/server/rbacStore");
      const db = await readRbac();
      db.users["6"] = {
        id: "6",
        name: "Temp",
        email: "temp@example.com",
        password: "pw",
      };
      db.roles["6"] = "viewer";
      await writeRbac(db);
      const stored = JSON.parse(
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- test uses a temp path
        await fs.readFile(path.join(dir, "data", "cms", "users.json"), "utf8")
      );
      expect(stored).toEqual(db);
    });
  });

  it("updates permissions for roles", async () => {
    await withTempDir(async (dir) => {
      const { readRbac, writeRbac } = await import("../src/lib/server/rbacStore");
      const db = await readRbac();
      db.permissions.admin = [PERMISSIONS[0]];
      await writeRbac(db);
      const stored = JSON.parse(
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- test uses a temp path
        await fs.readFile(path.join(dir, "data", "cms", "users.json"), "utf8")
      );
      expect(stored.permissions.admin).toEqual([PERMISSIONS[0]]);
    });
  });
});
