/** @jest-environment node */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import type { Role } from "@auth/types/roles";

const mockCookies = { get: jest.fn(), set: jest.fn(), delete: jest.fn() };
jest.mock("next/headers", () => ({
  headers: jest.fn(() => new Map()),
  cookies: jest.fn(() => mockCookies),
}));

jest.mock("@acme/config/env/core", () => {
  const env = {
    SESSION_SECRET: "test-session-secret-32-chars-long-string!",
    COOKIE_DOMAIN: "example.com",
  };
  return {
    coreEnv: env,
    loadCoreEnv: () => env,
  };
});

jest.mock("fs", () => {
  const actual = jest.requireActual("fs");
  return {
    ...actual,
    promises: {
      ...actual.promises,
      readFile: jest.fn().mockResolvedValue(JSON.stringify({ id: "shop-1" })),
      rm: jest.fn().mockResolvedValue(undefined),
    },
  };
});

jest.mock("../../../../../../scripts/src/republish-shop", () => ({
  republishShop: jest.fn(),
}), { virtual: true });

async function setSession(role: Role): Promise<void> {
  const { createCustomerSession, CUSTOMER_SESSION_COOKIE } = await import("@auth");
  mockCookies.get.mockReset();
  mockCookies.set.mockReset();
  await createCustomerSession({ customerId: "c1", role });
  const token = mockCookies.set.mock.calls.find(([name]) => name === CUSTOMER_SESSION_COOKIE)?.[1];
  mockCookies.get.mockReturnValue({ value: token });
}

afterEach(() => {
  jest.resetModules();
});

function loadRoute() {
  const src = fs.readFileSync(path.join(__dirname, "..", "route.ts"), "utf8");
  let js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
  js = js.replace(/const require = .*createRequire.*\n/, "");
  const mod: any = { exports: {} };
  const func = new Function("exports", "require", "module", "__filename", "__dirname", js);
  func(mod.exports, require, mod, __filename, path.join(__dirname, ".."));
  return mod.exports as { POST: () => Promise<Response> };
}

describe("POST /api/publish RBAC", () => {
  it("returns 401 for roles without manage_orders", async () => {
    const { POST } = loadRoute();
    for (const role of ["customer", "viewer"] as Role[]) {
      await setSession(role);
      const res = await POST();
      expect(res.status).toBe(401);
    }
  });

  it("returns 200 for authorized roles", async () => {
    const { POST } = loadRoute();
    await setSession("ShopAdmin");
    const res = await POST();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
  });
});

