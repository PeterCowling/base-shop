// apps/cms/__tests__/createShopActions.test.tsx
/* eslint-env jest */

import { jest } from "@jest/globals";
import fs from "node:fs/promises";
import path from "node:path";
import { withTempRepo, mockNextAuthAdmin } from "@acme/test-utils";
import "../src/types/next-auth.d.ts";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

interface StoredUsersFile {
  roles: Record<string, string | string[]>;
  users: Record<string, { id: string; email: string }>;
}

// Use shared helper to set up temp repo

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

const realFetch = global.fetch;

afterEach(() => {
  jest.resetAllMocks();
  global.fetch = realFetch;
});

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe("createNewShop authorization", () => {
  it("throws when session is missing", async () => {
    jest.resetModules();

    const prevEnv = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = "development";

    jest.doMock("@platform-core/createShop", () => ({
      __esModule: true,
      createShop: jest.fn(),
    }));
    jest.doMock("@acme/config", () => ({ env: { NEXTAUTH_SECRET: "test-nextauth-secret-32-chars-long-string!", EMAIL_FROM: "test@example.com", EMAIL_PROVIDER: "noop" } }));
    const { __setMockSession } = require('next-auth') as { __setMockSession: (s: any) => void };
    __setMockSession(null);

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
    mockNextAuthAdmin();
    jest.doMock("@acme/config", () => ({ env: { NEXTAUTH_SECRET: "test-nextauth-secret-32-chars-long-string!", EMAIL_FROM: "test@example.com", EMAIL_PROVIDER: "noop" } }));

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

describe("submitShop error handling", () => {
  const baseState: any = {
    storeName: "",
    logo: {},
    contactInfo: "",
    type: "sale",
    template: "",
    theme: "",
    payment: [],
    shipping: [],
    pageTitle: {},
    pageDescription: {},
    socialImage: "",
    navItems: [],
    pages: [],
    checkoutComponents: [],
    analyticsProvider: "",
    analyticsId: "",
    env: {},
  };

  beforeEach(() => {
    jest.resetModules();
  });

  it("returns error when env request fails", async () => {
    jest.doMock("@platform-core/createShop", () => ({
      __esModule: true,
      createShopOptionsSchema: { safeParse: () => ({ success: true, data: {} }) },
    }));
    jest.doMock("@platform-core/shops", () => ({
      validateShopName: jest.fn(),
    }));

    const { submitShop } = await import(
      /* webpackIgnore: true */ "../src/app/cms/wizard/services/submitShop"
    );

    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    global.fetch = mockFetch as any;

    const res = await submitShop("shop1", { ...baseState, env: { A: "1" } });

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/environment/i);
  });

  it("returns error when providers request fails", async () => {
    jest.doMock("@platform-core/createShop", () => ({
      __esModule: true,
      createShopOptionsSchema: { safeParse: () => ({ success: true, data: {} }) },
    }));
    jest.doMock("@platform-core/shops", () => ({
      validateShopName: jest.fn(),
    }));

    const { submitShop } = await import(
      /* webpackIgnore: true */ "../src/app/cms/wizard/services/submitShop"
    );

    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    global.fetch = mockFetch as any;

    const res = await submitShop("shop1", baseState);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/provider/i);
  });
});

describe("rbac actions persistence", () => {
  it("inviteUser stores roles", async () => {
    await withTempRepo(async (dir) => {
      const { inviteUser } = await import(
        /* webpackIgnore: true */ "../src/actions/rbac.server.ts"
      );
      const { readRbac } = await import("../src/lib/server/rbacStore");

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
      const { readRbac } = await import("../src/lib/server/rbacStore");

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
