// packages/platform-core/__tests__/createShopUtils.test.ts
import fs from "fs";
import { copyTemplate } from "../src/createShop/fsUtils";
import { loadBaseTokens } from "../src/createShop/themeUtils";
import { fillLocales } from "@i18n/fillLocales";
import { LOCALES } from "@i18n/locales";

describe("createShop utils", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });
  it("copies template directory with filter", () => {
    jest.spyOn(fs, "cpSync").mockImplementation(() => {});
    copyTemplate("src", "dest");
    expect(fs.cpSync).toHaveBeenCalledWith(
      "src",
      "dest",
      expect.objectContaining({ recursive: true, filter: expect.any(Function) })
    );
    const filter = (fs.cpSync as jest.Mock).mock.calls[0][2].filter as (
      src: string
    ) => boolean;
    expect(filter("a/node_modules/b")).toBe(false);
    expect(filter("a/src/index.ts")).toBe(true);
  });

  it("loads base tokens", () => {
    jest.spyOn(fs, "readFileSync").mockImplementation((p: fs.PathLike) => {
      const file = String(p);
      if (file.endsWith("tokens.ts")) {
        return "export const tokens = { '--color-bg': { light: '0 0% 100%' } };";
      }
      return "";
    });
    const tokens = loadBaseTokens();
    expect(tokens["--color-bg"]).toBeDefined();
  });

  it("fills locales with fallback", () => {
    const result = fillLocales({ en: "Hello" }, "Hi");
    expect(result.en).toBe("Hello");
    for (const loc of LOCALES) {
      if (loc === "en") continue;
      expect(result[loc as keyof typeof result]).toBe("Hi");
    }
  });
});
