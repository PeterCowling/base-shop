import fs from "fs";
import { createShop } from "../src/createShop";

jest.mock("fs");
jest.mock("child_process", () => ({ spawnSync: jest.fn() }));

const fsMock = fs as jest.Mocked<typeof fs>;

describe("createShop", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    fsMock.existsSync.mockImplementation((p: fs.PathLike) => {
      const file = String(p);
      if (file.includes("data/shops") || file.includes("apps/")) {
        return false;
      }
      return true;
    });
    fsMock.readdirSync.mockReturnValue(
      [] as unknown as ReturnType<typeof fs.readdirSync>
    );
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
      if (file.includes("packages/themes/base/tokens.ts")) {
        return "export const tokens = { foo: { light: '#fff' } };";
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
    const filter = (
      fsMock.cpSync.mock.calls[0][2] as { filter: (src: string) => boolean }
    ).filter;
    expect(filter("foo/node_modules/bar")).toBe(false);
    expect(filter("foo/src/index.ts")).toBe(true);
    expect(fsMock.cpSync).toHaveBeenCalledWith(
      "postcss.config.cjs",
      expect.stringContaining("apps/shop1/postcss.config.cjs")
    );
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
      const file = String(p);
      if (file.includes("data/shops") || file.includes("apps/")) {
        return false;
      }
      return !file.includes("missing-template");
    });
    expect(() => createShop("id", { template: "missing-template" })).toThrow(
      "Template 'missing-template'"
    );
  });

  it("normalizes a valid shop id", () => {
    createShop("  store_3 ", {});
    const envCall = fsMock.writeFileSync.mock.calls.find((c) =>
      String(c[0]).includes(".env")
    );
    expect(envCall).toBeTruthy();
    const content = envCall![1] as string;
    expect(content).toContain("NEXT_PUBLIC_SHOP_ID=store_3");
    expect(fsMock.cpSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining("apps/store_3"),
      expect.any(Object)
    );
  });

  it("throws for invalid shop id", () => {
    expect(() => createShop("bad/name", {})).toThrow("Invalid shop name");
  });
});
