import { readFile } from "node:fs/promises";

import { fillLocales, type Locale,LOCALES } from "@acme/i18n";

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
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- dynamic test input for locale files
        const json = await readFile(`/locales/${locale}.json`, "utf8");
        const data = JSON.parse(json) as Record<string, string>;
        for (const [key, value] of Object.entries(data)) {
          translations[key] ??= {};
          translations[key][locale] = value;
        }
      } catch {
        // ignore missing files
      }
    }

    const result = Object.fromEntries(
      Object.entries(translations).map(([key, map]) => [
        key,
        fillLocales(map, map.en!),
      ])
    );

    // Build expected object according to the current LOCALES set
    const expGreet: Record<Locale, string> = fillLocales({ en: "Hello", de: "Hallo" } as any, "Hello");
    const expBye: Record<Locale, string> = fillLocales({ en: "Bye", de: "Bye" } as any, "Bye");
    expect(result).toEqual({ greet: expGreet, bye: expBye });
  });
});
