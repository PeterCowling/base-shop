/** @jest-environment node */
/* eslint-disable security/detect-non-literal-fs-filename -- Test creates temporary paths per-case. */

import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  extractStringsFromContent,
  listJsonFiles,
  readJson,
} from "../src/fsContent";

describe("fsContent utilities", () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(path.join(tmpdir(), "guides-core-fs-"));
  });

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true });
  });

  it("listJsonFiles returns deterministic sorted relative paths", async () => {
    mkdirSync(path.join(rootDir, "a", "nested"), { recursive: true });
    mkdirSync(path.join(rootDir, "z"), { recursive: true });

    writeFileSync(path.join(rootDir, "z", "zeta.json"), "{}\n", "utf8");
    writeFileSync(path.join(rootDir, "a", "alpha.json"), "{}\n", "utf8");
    writeFileSync(path.join(rootDir, "a", "nested", "beta.json"), "{}\n", "utf8");
    writeFileSync(path.join(rootDir, "a", "nested", "ignore.txt"), "x\n", "utf8");

    await expect(listJsonFiles(rootDir)).resolves.toEqual([
      path.join("a", "alpha.json"),
      path.join("a", "nested", "beta.json"),
      path.join("z", "zeta.json"),
    ]);
  });

  it("readJson parses valid JSON and throws for invalid JSON", async () => {
    const validPath = path.join(rootDir, "valid.json");
    const invalidPath = path.join(rootDir, "invalid.json");
    writeFileSync(validPath, "{ \"ok\": true }\n", "utf8");
    writeFileSync(invalidPath, "{ not-json }\n", "utf8");

    await expect(readJson<{ ok: boolean }>(validPath)).resolves.toEqual({
      ok: true,
    });
    await expect(readJson(invalidPath)).rejects.toThrow();
  });

  it("extractStringsFromContent returns all nested string leaves", () => {
    const input = {
      seo: {
        title: "Title",
        description: "Description",
      },
      sections: [
        {
          id: "intro",
          title: "Intro",
          body: ["Paragraph 1", "Paragraph 2"],
          count: 1,
          enabled: true,
        },
      ],
      misc: null,
    };

    expect(extractStringsFromContent(input)).toEqual([
      "Title",
      "Description",
      "intro",
      "Intro",
      "Paragraph 1",
      "Paragraph 2",
    ]);
  });
});
