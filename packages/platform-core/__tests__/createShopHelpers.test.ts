// packages/platform-core/__tests__/createShopHelpers.test.ts
import fs from "fs";

import {
  copyTemplate,
  ensureTemplateExists,
  readFile,
  writeFile,
} from "../src/createShop/fsUtils";
import { createShopOptionsSchema, prepareOptions } from "../src/createShop/schema";

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

    it("returns defaults when analytics, navItems, and pages are omitted", () => {
      const opts = prepareOptions("shop", {});
      expect(opts.analytics).toEqual({ enabled: false, provider: "none" });
      expect(opts.navItems).toEqual([]);
      expect(opts.pages).toEqual([]);
    });

    it("handles nested navigation items", () => {
      const opts = prepareOptions("shop", {
        navItems: [
          {
            label: "Parent",
            url: "/parent",
            children: [
              {
                label: "Child",
                url: "/child",
                children: [{ label: "Grand", url: "/grand" }],
              },
            ],
          },
        ],
      });
      expect(opts.navItems).toEqual([
        {
          label: "Parent",
          url: "/parent",
          children: [
            {
              label: "Child",
              url: "/child",
              children: [{ label: "Grand", url: "/grand" }],
            },
          ],
        },
      ]);
    });

    it("generates page slug from title when missing", () => {
      const parseSpy = jest
        .spyOn(createShopOptionsSchema, "parse")
        .mockImplementation((o: any) => o);
      const opts = prepareOptions("shop", {
        pages: [{ title: { en: "About Us" }, components: [] }],
      } as any);
      expect(opts.pages[0].slug).toBe("about-us");
      parseSpy.mockRestore();
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

