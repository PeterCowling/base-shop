// packages/platform-core/__tests__/createShopHelpers.test.ts
import fs from "fs";
import { prepareOptions } from "../src/createShop/schema";
import {
  ensureTemplateExists,
  readFile,
  writeFile,
  copyTemplate,
} from "../src/createShop/fsUtils";

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

  describe("readFile", () => {
    it("reads using utf8", () => {
      fsMock.readFileSync.mockReturnValue("content" as unknown as Buffer);
      const res = readFile("file.txt");
      expect(res).toBe("content");
      expect(fsMock.readFileSync).toHaveBeenCalledWith("file.txt", "utf8");
    });
  });

  describe("writeFile", () => {
    it("writes using utf8", () => {
      writeFile("file.txt", "data");
      expect(fsMock.writeFileSync).toHaveBeenCalledWith("file.txt", "data");
    });
  });

  describe("copyTemplate", () => {
    it("skips node_modules", () => {
      copyTemplate("src", "dest");
      const args = fsMock.cpSync.mock.calls[0];
      expect(args[0]).toBe("src");
      expect(args[1]).toBe("dest");
      const filter = (args[2] as any).filter as (s: string) => boolean;
      expect(filter("/foo/node_modules/bar")).toBe(false);
      expect(filter("/foo/other")).toBe(true);
    });
  });
});

