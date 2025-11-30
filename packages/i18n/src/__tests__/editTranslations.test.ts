import path from "node:path";

const files: Record<string, string> = {};

const fsMock = {
  readFileSync: jest.fn((file: string, encoding: string) => {
    if (encoding !== "utf8") {
      throw new Error("Unexpected encoding");
    }
    const value = files[file];
    if (value === undefined) {
      throw new Error(`File not found: ${file}`);
    }
    return value;
  }),
  writeFileSync: jest.fn((file: string, content: string, encoding: string) => {
    if (encoding !== "utf8") {
      throw new Error("Unexpected encoding");
    }
    files[file] = content;
  }),
};

jest.mock("node:fs", () => fsMock);

import { addOrUpdateKey, readLocalizedValues } from "../editTranslations";

describe("editTranslations helpers", () => {
  const srcDir = path.join(__dirname, "..");
  const enFile = path.join(srcDir, "en.json");
  const deFile = path.join(srcDir, "de.json");
  const itFile = path.join(srcDir, "it.json");

  beforeEach(() => {
    for (const key of Object.keys(files)) {
      delete files[key];
    }
    fsMock.readFileSync.mockClear();
    fsMock.writeFileSync.mockClear();

    files[enFile] = JSON.stringify({ existing: "A", title: "Title EN" });
    files[deFile] = JSON.stringify({ existing: "B" });
    files[itFile] = JSON.stringify({ existing: "C" });
  });

  it("adds missing key to non-English locales without overwriting existing values", () => {
    addOrUpdateKey("title", "Title EN");

    expect(fsMock.writeFileSync).toHaveBeenCalledTimes(2);

    const de = JSON.parse(files[deFile]) as Record<string, string>;
    const it = JSON.parse(files[itFile]) as Record<string, string>;
    const en = JSON.parse(files[enFile]) as Record<string, string>;

    expect(en).toEqual({ existing: "A", title: "Title EN" });
    expect(de).toEqual({ existing: "B", title: "Title EN" });
    expect(it).toEqual({ existing: "C", title: "Title EN" });
  });

  it("reads localized values for the given key", () => {
    files[deFile] = JSON.stringify({ existing: "B", title: "Titel DE" });

    const values = readLocalizedValues("title");

    expect(values).toEqual({ en: "Title EN", de: "Titel DE" });
  });
});

