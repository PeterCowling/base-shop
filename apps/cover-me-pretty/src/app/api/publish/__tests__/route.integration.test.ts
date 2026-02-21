/** @jest-environment node */

import path from "node:path";

import fs from "fs";
import ts from "typescript";

import { createCustomerSession, CUSTOMER_SESSION_COOKIE } from "@acme/auth";
import type { Role } from "@acme/auth/types/roles";

jest.setTimeout(60000);

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

const mockedFs = jest.requireMock("fs") as {
  promises: { readFile: jest.Mock; rm: jest.Mock };
};

jest.mock(
  "../../../../../../scripts/src/republish-shop",
  () => ({ republishShop: jest.fn() }),
  { virtual: true },
);

const { republishShop } = jest.requireMock(
  "../../../../../../scripts/src/republish-shop",
) as { republishShop: jest.Mock };

async function setSession(role: Role): Promise<void> {
  mockCookies.get.mockReset();
  mockCookies.set.mockReset();
  mockCookies.delete.mockReset();

  await createCustomerSession({ customerId: "c1", role });

  const token = mockCookies.set.mock.calls.find(
    ([name]) => name === CUSTOMER_SESSION_COOKIE,
  )?.[1];

  if (!token) {
    throw new Error("Failed to set customer session token in test");
  }

  mockCookies.get.mockImplementation((name: string) => {
    if (name === CUSTOMER_SESSION_COOKIE) return { value: token };
    return undefined;
  });
}

afterEach(() => {
  jest.clearAllMocks();
});

function loadRoute() {
  const src = fs.readFileSync(path.join(__dirname, "..", "route.ts"), "utf8");
  let js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
  js = js.replace(/const require = .*createRequire.*\n/, "");
  const mod: { exports: unknown } = { exports: {} };
  const func = new Function("exports", "require", "module", "__filename", "__dirname", js);
  func(mod.exports, require, mod, __filename, path.join(__dirname, ".."));
  return mod.exports as { POST: () => Promise<Response> };
}

describe("POST /api/publish RBAC", () => {
  it("returns 401 for a role without manage_orders", async () => {
    const { POST } = loadRoute();
    await setSession("customer");
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("returns 200 for an authorized role", async () => {
    const { POST } = loadRoute();
    await setSession("ShopAdmin");
    const res = await POST();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
    expect(mockedFs.promises.rm).toHaveBeenCalledWith(
      expect.stringContaining(path.join("data", "shops", "shop-1", "upgrade.json")),
      { force: true }
    );
  });
});

describe("POST /api/publish errors", () => {
  it.each<[string, () => void]>([
    ["readFile", () => mockedFs.promises.readFile.mockRejectedValueOnce(new Error("fail"))],
    [
      "republishShop",
      () =>
        republishShop.mockImplementationOnce(() => {
          throw new Error("fail");
        }),
    ],
    ["rm", () => mockedFs.promises.rm.mockRejectedValueOnce(new Error("fail"))],
  ])("returns 500 when %s throws", async (_label, setup) => {
    const { POST } = loadRoute();
    await setSession("ShopAdmin");
    setup();
    const res = await POST();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Publish failed" });
  });
});
