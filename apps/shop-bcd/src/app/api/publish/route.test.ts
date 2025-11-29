/** @jest-environment node */
import fs from "fs";
import path from "node:path";
import ts from "typescript";
import { requirePermission } from "@auth";
import { republishShop } from "../../../../../../scripts/src/republish-shop";

jest.mock("@auth", () => ({ requirePermission: jest.fn() }));
const mockedRequirePermission = requirePermission as jest.Mock;

jest.mock("fs", () => {
  const actual = jest.requireActual("fs") as typeof import("fs");
  return {
    ...actual,
    promises: {
      ...actual.promises,
      readFile: jest.fn(),
      rm: jest.fn(),
    },
  };
});
const fsPromises = fs.promises as { readFile: jest.Mock; rm: jest.Mock };

jest.mock(
  "../../../../../../scripts/src/republish-shop",
  () => ({ republishShop: jest.fn() }),
  { virtual: true },
);
const mockedRepublishShop = republishShop as jest.Mock;

function loadRoute() {
  const src = fs.readFileSync(path.join(__dirname, "route.ts"), "utf8");
  let js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
  js = js.replace(/const require = .*createRequire.*\n/, "");
  const mod: { exports: unknown } = { exports: {} };
  const func = new Function("exports", "require", "module", "__filename", "__dirname", js);
  func(mod.exports, require, mod, __filename, path.join(__dirname, ".."));
  return mod.exports as { POST: () => Promise<Response> };
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/publish", () => {
  it("returns 401 when unauthorized", async () => {
    const { POST } = loadRoute();
    mockedRequirePermission.mockRejectedValueOnce(new Error("nope"));
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("publishes shop and removes upgrade file", async () => {
    const { POST } = loadRoute();
    mockedRequirePermission.mockResolvedValueOnce(undefined);
    fsPromises.readFile.mockResolvedValueOnce(JSON.stringify({ id: "shop-1" }));
    fsPromises.rm.mockResolvedValueOnce(undefined);
    const res = await POST();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
    expect(republishShop).toHaveBeenCalled();
    expect(fsPromises.rm).toHaveBeenCalledWith(
      expect.stringContaining("data/shops/shop-1/upgrade.json"),
      { force: true }
    );
  });

  it("returns 500 on failure", async () => {
    const { POST } = loadRoute();
    mockedRequirePermission.mockResolvedValueOnce(undefined);
    fsPromises.readFile.mockResolvedValueOnce(JSON.stringify({ id: "shop-1" }));
    mockedRepublishShop.mockImplementationOnce(() => {
      throw new Error("fail");
    });
    const res = await POST();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Publish failed" });
  });
});
