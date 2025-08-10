// apps/cms/__tests__/createShopActions.test.tsx
/* eslint-env jest */

import { jest } from "@jest/globals";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import "../src/types/next-auth.d.ts";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

interface StoredUsersFile {
  roles: Record<string, string | string[]>;
  users: Record<string, { id: string; email: string }>;
}

async function withTempRepo(cb: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "rbac-"));
  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();
  try {
    await cb(dir);
  } finally {
    process.chdir(cwd);
  }
}

function fd(data: Record<string, string | string[]>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v)) {
      for (const val of v) f.append(k, val);
    } else {
      f.append(k, v);
    }
  }
  return f;
}

afterEach(() => jest.resetAllMocks());

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe("createNewShop authorization", () => {
  it("throws when session is missing", async () => {
    jest.resetModules();

    const prevEnv = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = "development";

    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn(() => Promise.resolve(null)),
    }));

    const { createNewShop } = await import(
      /* webpackIgnore: true */ "../src/actions/createShop.server.ts"
    );

    await expect(createNewShop("shop1", {} as any)).rejects.toThrow(
      "Forbidden"
    );

    (process.env as Record<string, string>).NODE_ENV = prevEnv;
  });

  it("calls createShop when authorized", async () => {
    jest.resetModules();

    const prevEnv = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = "development";

    const deployResult = { status: "success", previewUrl: "https://shop2.pages.dev" };
    const createShop = jest.fn().mockResolvedValue(deployResult);
    jest.doMock("@platform-core/createShop", () => ({
      __esModule: true,
      createShop,
    }));
    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn(() =>
        Promise.resolve({ user: { role: "admin" } })
      ),
    }));

    const { createNewShop } = await import(
      /* webpackIgnore: true */ "../src/actions/createShop.server.ts"
    );
    const res = await createNewShop("shop2", { theme: "base" } as any);

    expect(createShop).toHaveBeenCalledTimes(1);
    expect(createShop).toHaveBeenCalledWith("shop2", { theme: "base" }, { deploy: false });
    expect(res).toBe(deployResult);

    (process.env as Record<string, string>).NODE_ENV = prevEnv;
  });
});

describe("rbac actions persistence", () => {
  it("inviteUser stores roles", async () => {
    await withTempRepo(async (dir) => {
      const { inviteUser } = await import(
        /* webpackIgnore: true */ "../src/actions/rbac.server.ts"
      );
      const { readRbac } = await import("../src/lib/rbacStore");

      await inviteUser(
        fd({
          name: "Bob",
          email: "bob@example.com",
          password: "pw",
          roles: "viewer",
        })
      );

      const db = await readRbac();
      const user = Object.values(db.users).find(
        (u) => u.email === "bob@example.com"
      );
      expect(user).toBeDefined();
      expect(db.roles[user!.id]).toBe("viewer");

      const stored = JSON.parse(
        await fs.readFile(path.join(dir, "data", "cms", "users.json"), "utf8")
      ) as StoredUsersFile;

      expect(stored.roles[user!.id]).toBe("viewer");
    });
  });

  it("updateUserRoles persists changes", async () => {
    await withTempRepo(async (dir) => {
      const { updateUserRoles } = await import(
        /* webpackIgnore: true */ "../src/actions/rbac.server.ts"
      );
      const { readRbac } = await import("../src/lib/rbacStore");

      const form = fd({ id: "2", roles: ["admin", "viewer"] });
      await updateUserRoles(form);

      const db = await readRbac();
      expect(db.roles["2"]).toEqual(["admin", "viewer"]);

      const file = JSON.parse(
        await fs.readFile(path.join(dir, "data", "cms", "users.json"), "utf8")
      ) as StoredUsersFile;

      expect(file.roles["2"]).toEqual(["admin", "viewer"]);
    });
  });
});
