import { slugify, genSecret, fillLocales } from "../string";
import { LOCALES } from "@i18n/locales";

describe("string utils", () => {
  describe("slugify", () => {
    it("handles mixed-case, spaces, and punctuation", () => {
      expect(slugify("HeLLo,  World!! Foo-Bar"))
        .toBe("hello-world-foo-bar");
    });
  });

  describe("genSecret", () => {
    it("returns hex string of default length", () => {
      const secret = genSecret();
      expect(secret).toMatch(/^[0-9a-f]+$/);
      expect(secret).toHaveLength(32);
    });

    it("returns hex string of custom length", () => {
      const secret = genSecret(8);
      expect(secret).toMatch(/^[0-9a-f]+$/);
      expect(secret).toHaveLength(16);
    });
  });

  describe("fillLocales", () => {
    it("populates all locales and falls back when missing", () => {
      const result = fillLocales({ en: "Hello" }, "Hi");
      expect(Object.keys(result)).toEqual([...LOCALES]);
      for (const locale of LOCALES) {
        if (locale === "en") {
          expect(result[locale]).toBe("Hello");
        } else {
          expect(result[locale]).toBe("Hi");
        }
      }
    });
  });
});
