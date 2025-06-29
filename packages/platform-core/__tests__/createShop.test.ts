import { spawnSync } from "child_process";
import fs from "fs";
import { createShop } from "../createShop";

jest.mock("fs");
jest.mock("child_process", () => ({ spawnSync: jest.fn() }));

const fsMock = fs as jest.Mocked<typeof fs>;
const spawnMock = spawnSync as jest.Mock;

describe("createShop", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    fsMock.existsSync.mockImplementation((p: fs.PathLike) => {
      return !String(p).includes("data/shops");
    });
    fsMock.readdirSync.mockReturnValue([] as any);
    fsMock.readFileSync.mockImplementation((p: fs.PathLike) => {
      const file = String(p);
      if (file.endsWith("package.json")) {
        return JSON.stringify({
          name: "template",
          dependencies: { "@themes/base": "*" },
        });
      }
      if (file.endsWith("globals.css")) {
        return "@import '@themes/base/tokens.css';";
      }
      return "";
    });
  });

  it("copies template directory", () => {
    createShop("shop1", { template: "template-app" });
    expect(fsMock.cpSync).toHaveBeenCalledWith(
      expect.stringContaining("packages/template-app"),
      expect.stringContaining("apps/shop1"),
      expect.objectContaining({ recursive: true, filter: expect.any(Function) })
    );
    const filter = (fsMock.cpSync.mock.calls[0][2] as any).filter;
    expect(filter("foo/node_modules/bar")).toBe(false);
    expect(filter("foo/src/index.ts")).toBe(true);
  });

  it("writes .env with generated secrets", () => {
    createShop("shop2", {});
    const call = fsMock.writeFileSync.mock.calls.find((c) =>
      String(c[0]).includes(".env")
    );
    expect(call).toBeTruthy();
    const content = call![1] as string;
    expect(content).toContain("NEXT_PUBLIC_SHOP_ID=shop2");
    expect(content).toMatch(/PREVIEW_TOKEN_SECRET=.*/);
    expect(content).toMatch(/NEXTAUTH_SECRET=.*/);
  });

  it("throws when template missing", () => {
    fsMock.existsSync.mockImplementation((p: fs.PathLike) => {
      return !String(p).includes("missing-template");
    });
    expect(() => createShop("id", { template: "missing-template" })).toThrow(
      "Template 'missing-template'"
    );
  });
});
