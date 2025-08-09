// packages/platform-core/__tests__/createShopHelpers.test.ts
import fs from "fs";
import {
  prepareOptions,
  ensureTemplateExists,
  writeFiles,
} from "../src/createShop";

jest.mock("fs");

const fsMock = fs as jest.Mocked<typeof fs>;

describe("createShop helpers", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("prepareOptions", () => {
    it("applies defaults", () => {
      const opts = prepareOptions("shop", {
        pages: [{ slug: "test", title: { en: "Test Page" }, components: [] }],
      });
      expect(opts.name).toBe("shop");
      expect(opts.pages[0].slug).toBe("test");
    });
  });

  describe("ensureTemplateExists", () => {
    it("returns template path when both exist", () => {
      fsMock.existsSync.mockImplementation((p: fs.PathLike) => {
        const path = String(p);
        return (
          path.includes("packages/themes/base") ||
          path.includes("packages/template-app")
        );
      });
      const res = ensureTemplateExists("base", "template-app");
      expect(res).toContain("packages/template-app");
    });

    it("throws for missing theme", () => {
      fsMock.existsSync.mockReturnValue(false);
      expect(() => ensureTemplateExists("missing", "template-app")).toThrow(
        "Theme 'missing'"
      );
    });

    it("throws for missing template", () => {
      fsMock.existsSync.mockImplementation((p: fs.PathLike) => {
        const path = String(p);
        return path.includes("packages/themes/base");
      });
      expect(() => ensureTemplateExists("base", "missing")).toThrow(
        "Template 'missing'"
      );
    });
  });

  describe("writeFiles", () => {
    beforeEach(() => {
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
      fsMock.existsSync.mockReturnValue(true);
    });

    it("writes env and shop files", () => {
      const options = prepareOptions("shop", {});
      writeFiles(
        "shop",
        options,
        "packages/template-app",
        "apps/shop",
        "data/shops/shop"
      );
      const envCall = fsMock.writeFileSync.mock.calls.find((c) =>
        String(c[0]).includes(".env")
      );
      expect(envCall).toBeTruthy();
      const shopCall = fsMock.writeFileSync.mock.calls.find((c) =>
        String(c[0]).includes("shop.json")
      );
      expect(shopCall).toBeTruthy();
    });
  });
});

