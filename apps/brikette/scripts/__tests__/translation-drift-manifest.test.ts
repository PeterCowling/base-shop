/* eslint-disable security/detect-non-literal-fs-filename -- Tests create isolated temporary fixture trees. */
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  buildTranslationDriftManifest,
  checkTranslationDriftManifest,
  TRANSLATION_DRIFT_SCHEMA_VERSION,
} from "../lib/translation-drift-manifest";

function writeJson(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readJson<T = unknown>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

describe("translation drift manifest workflow", () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(path.join(tmpdir(), "translation-drift-"));

    const locales = ["en", "it", "de"];
    for (const locale of locales) {
      writeJson(path.join(rootDir, locale, "guides.json"), {
        content: {
          historyPositano: "History of Positano",
        },
      });
      writeJson(path.join(rootDir, locale, "guides.tags.json"), {
        beaches: "Beaches",
      });
      writeJson(path.join(rootDir, locale, "guidesFallback.json"), {
        fallback: "fallback text",
      });
      writeJson(path.join(rootDir, locale, "guides", "content", "historyPositano.json"), {
        seo: {
          title: locale === "en" ? "History Positano" : `History Positano ${locale}`,
          description: "Guide description",
        },
        intro: "Intro text",
      });
    }
  });

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true });
  });

  it("reports no stale locales when source and locale files are unchanged", async () => {
    const manifest = await buildTranslationDriftManifest({
      localesRoot: rootDir,
      baselineLocale: "en",
      locales: ["it", "de"],
    });
    const report = await checkTranslationDriftManifest({
      manifest,
      localesRoot: rootDir,
    });

    expect(manifest.schemaVersion).toBe(TRANSLATION_DRIFT_SCHEMA_VERSION);
    expect(report.schemaVersion).toBe(TRANSLATION_DRIFT_SCHEMA_VERSION);
    expect(report.summary.staleLocales).toBe(0);
    expect(report.summary.missingLocales).toBe(0);
    expect(report.summary.newTrackedFilesSinceManifest).toBe(0);
  });

  it("marks dependent locales stale when EN source changes", async () => {
    const manifest = await buildTranslationDriftManifest({
      localesRoot: rootDir,
      baselineLocale: "en",
      locales: ["it", "de"],
    });

    const sourcePath = path.join(
      rootDir,
      "en",
      "guides",
      "content",
      "historyPositano.json",
    );
    const source = readJson<Record<string, unknown>>(sourcePath);
    writeJson(sourcePath, {
      ...source,
      intro: "Updated intro text",
    });

    const report = await checkTranslationDriftManifest({
      manifest,
      localesRoot: rootDir,
    });

    const staleForGuide = report.stale.filter(
      (entry) => entry.relativePath === path.join("guides", "content", "historyPositano.json"),
    );
    expect(staleForGuide.map((entry) => entry.locale).sort()).toEqual(["de", "it"]);
  });

  it("clears staleness only for locale files that were refreshed", async () => {
    const manifest = await buildTranslationDriftManifest({
      localesRoot: rootDir,
      baselineLocale: "en",
      locales: ["it", "de"],
    });

    const sourcePath = path.join(
      rootDir,
      "en",
      "guides",
      "content",
      "historyPositano.json",
    );
    const itPath = path.join(
      rootDir,
      "it",
      "guides",
      "content",
      "historyPositano.json",
    );

    writeJson(sourcePath, {
      seo: { title: "History Positano v2", description: "Guide description" },
      intro: "Updated intro text",
    });
    writeJson(itPath, {
      seo: { title: "Storia Positano v2", description: "Guide description" },
      intro: "Intro aggiornata",
    });

    const report = await checkTranslationDriftManifest({
      manifest,
      localesRoot: rootDir,
    });

    const staleForGuide = report.stale.filter(
      (entry) => entry.relativePath === path.join("guides", "content", "historyPositano.json"),
    );
    expect(staleForGuide.map((entry) => entry.locale)).toEqual(["de"]);
  });

  it("emits stable machine-readable JSON shape with schemaVersion", async () => {
    const manifest = await buildTranslationDriftManifest({
      localesRoot: rootDir,
      baselineLocale: "en",
      locales: ["it", "de"],
    });
    const report = await checkTranslationDriftManifest({
      manifest,
      localesRoot: rootDir,
    });

    const asJson = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
    expect(asJson).toEqual(
      expect.objectContaining({
        schemaVersion: TRANSLATION_DRIFT_SCHEMA_VERSION,
        baselineLocale: "en",
        locales: ["it", "de"],
        summary: expect.any(Object),
        stale: expect.any(Array),
        missing: expect.any(Array),
        fresh: expect.any(Array),
      }),
    );
  });
});
