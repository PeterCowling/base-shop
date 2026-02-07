import { readFile } from "node:fs/promises";

import { fillLocales } from "../fillLocales";
import { type Locale,LOCALES } from "../locales";

jest.mock("node:fs/promises", () => ({
  readFile: jest.fn(),
}));

const readFileMock = readFile as jest.MockedFunction<typeof readFile>;

describe("fillLocales with filesystem", () => {
  it("merges keys and skips missing locale files", async () => {
    readFileMock.mockImplementation(async (file: string) => {
      if (file.endsWith("en.json")) {
        return JSON.stringify({ greet: "Hello", bye: "Bye" });
      }
      if (file.endsWith("de.json")) {
        return JSON.stringify({ greet: "Hallo" });
      }
      const err: NodeJS.ErrnoException = new Error("not found");
      err.code = "ENOENT";
      throw err;
    });

    const translations: Record<string, Partial<Record<Locale, string>>> = {};

    for (const locale of LOCALES) {
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test builds file paths from a fixed LOCALES enum; fs is mocked
        const json = await readFile(`/locales/${locale}.json`, "utf8");
        const data = JSON.parse(json) as Record<string, string>;
        for (const [key, value] of Object.entries(data)) {
          translations[key] ??= {};
          translations[key][locale] = value;
        }
      } catch {
        /* ignore missing files */
      }
    }

    const result = Object.fromEntries(
      Object.entries(translations).map(([key, map]) => [
        key,
        fillLocales(map, map.en!),
      ])
    );

    expect(result).toEqual({
      greet: { en: "Hello", de: "Hallo", it: "Hello" },
      bye: { en: "Bye", de: "Bye", it: "Bye" },
    });
  });

  it("applies fallback when default locale file is missing", async () => {
    readFileMock.mockImplementation(async (file: string) => {
      if (file.endsWith("de.json")) {
        return JSON.stringify({ greet: "Hallo" });
      }
      const err: NodeJS.ErrnoException = new Error("not found");
      err.code = "ENOENT";
      throw err;
    });

    const translations: Record<string, Partial<Record<Locale, string>>> = {};

    for (const locale of LOCALES) {
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test builds file paths from a fixed LOCALES enum; fs is mocked
        const json = await readFile(`/locales/${locale}.json`, "utf8");
        const data = JSON.parse(json) as Record<string, string>;
        for (const [key, value] of Object.entries(data)) {
          translations[key] ??= {};
          translations[key][locale] = value;
        }
      } catch {
        /* ignore missing files */
      }
    }

    const result = Object.fromEntries(
      Object.entries(translations).map(([key, map]) => [
        key,
        fillLocales(map, "Hi"),
      ])
    );

    expect(result).toEqual({
      greet: { en: "Hi", de: "Hallo", it: "Hi" },
    });
  });
});
