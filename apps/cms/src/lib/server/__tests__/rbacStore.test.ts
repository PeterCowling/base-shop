import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ROLE_PERMISSIONS } from "@auth/permissions";
import type { Permission } from "@auth";

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
      const { readRbac } = await import("../rbacStore");
      const db = await readRbac();
      expect(db.users["1"].email).toBe("admin@example.com");
      expect(db.roles["1"]).toBe("admin");
      expect(db.permissions.admin).toEqual(ROLE_PERMISSIONS.admin);
    });
  });

  it("falls back to defaults when JSON malformed", async () => {
    await withTempDir(async (dir) => {
      const { readRbac } = await import("../rbacStore");
      const defaultDb = await readRbac();
      const file = path.join(dir, "data", "cms", "users.json");
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, "{not valid json", "utf8");
      const db = await readRbac();
      expect(db).toEqual(defaultDb);
    });
  });

  it("merges extra permissions with defaults", async () => {
    await withTempDir(async (dir) => {
      const { readRbac } = await import("../rbacStore");
      const defaultDb = await readRbac();
      const extraPerm = "extra_perm" as unknown as Permission;
      const file = path.join(dir, "data", "cms", "users.json");
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(
        file,
        JSON.stringify({
          users: {},
          roles: {},
          permissions: { admin: [extraPerm] },
        }),
        "utf8"
      );
      const db = await readRbac();
      expect(db.permissions.admin).toEqual([
        ...defaultDb.permissions.admin,
        extraPerm,
      ]);
    });
  });

  it("resolves existing data/cms directory then falls back when missing", async () => {
    await withTempDir(async (root) => {
      const nested = path.join(root, "nested", "dir");
      await fs.mkdir(nested, { recursive: true });
      const cmsDir = path.join(root, "data", "cms");
      await fs.mkdir(cmsDir, { recursive: true });
      const cwdSpy = jest.spyOn(process, "cwd").mockReturnValue(nested);
      try {
        jest.resetModules();
        let { readRbac, writeRbac } = await import("../rbacStore");
        const db = await readRbac();
        await writeRbac(db);
        await expect(
          fs.access(path.join(root, "data", "cms", "users.json"))
        ).resolves.toBeUndefined();
        await expect(
          fs.access(path.join(nested, "data", "cms", "users.json"))
        ).rejects.toThrow();

        await fs.rm(path.join(root, "data"), { recursive: true, force: true });
        jest.resetModules();
        ({ readRbac, writeRbac } = await import("../rbacStore"));
        const db2 = await readRbac();
        await writeRbac(db2);
        await expect(
          fs.access(path.join(nested, "data", "cms", "users.json"))
        ).resolves.toBeUndefined();
        await expect(
          fs.access(path.join(root, "data", "cms", "users.json"))
        ).rejects.toThrow();
      } finally {
        cwdSpy.mockRestore();
      }
    });
  });

  it("writeRbac throws TypeError for null or undefined", async () => {
    const { writeRbac } = await import("../rbacStore");
    await expect(writeRbac(null as any)).rejects.toThrow(TypeError);
    await expect(writeRbac(undefined as any)).rejects.toThrow(TypeError);
  });

  it("writeRbac(null) does not create a file", async () => {
    await withTempDir(async (dir) => {
      const { writeRbac } = await import("../rbacStore");
      const file = path.join(dir, "data", "cms", "users.json");
      await expect(writeRbac(null as any)).rejects.toThrow(TypeError);
      await expect(fs.access(file)).rejects.toThrow();
    });
  });

  it("writeRbac calls fs.rename", async () => {
    await withTempDir(async () => {
      jest.resetModules();
      jest.mock("fs", () => {
        const actual = jest.requireActual("fs") as typeof import("fs");
        return {
          ...actual,
          promises: {
            ...actual.promises,
            rename: jest.fn().mockResolvedValue(undefined),
          },
        } as typeof import("fs");
      });
      const { readRbac, writeRbac } = await import("../rbacStore");
      const fsMock = await import("fs");
      const db = await readRbac();
      await writeRbac(db);
      const dest = path.join(process.cwd(), "data", "cms", "users.json");
      const calls = (fsMock.promises.rename as jest.Mock).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const match = calls.find(([, to]: [string, string]) => to === dest);
      expect(match).toBeDefined();
      expect(match![0]).toMatch(/users\.json\.\d+\.tmp$/);
    });
  });
});

