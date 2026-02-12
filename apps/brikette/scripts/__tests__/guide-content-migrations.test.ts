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
  GUIDE_CONTENT_MIGRATION_REPORT_SCHEMA_VERSION,
  runGuideContentMigrations,
} from "../lib/guide-content-migrations";

function writeJson(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readJson<T = unknown>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

describe("guide content schema migration runner", () => {
  let rootDir: string;
  let guidePath: string;

  beforeEach(() => {
    rootDir = mkdtempSync(path.join(tmpdir(), "guide-content-migrations-"));
    guidePath = path.join(
      rootDir,
      "en",
      "guides",
      "content",
      "historyPositano.json",
    );
    writeJson(guidePath, {
      seo: {
        title: "History Positano",
        description: "Guide description",
      },
      intro: "Intro text",
    });
  });

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true });
  });

  it("dry-run reports candidate changes without writing files", async () => {
    const before = readJson<Record<string, unknown>>(guidePath);

    const report = await runGuideContentMigrations({
      localesRoot: rootDir,
      locales: ["en"],
      fromVersion: 1,
      toVersion: 2,
      dryRun: true,
    });

    const after = readJson<Record<string, unknown>>(guidePath);
    expect(report.schemaVersion).toBe(GUIDE_CONTENT_MIGRATION_REPORT_SCHEMA_VERSION);
    expect(report.summary.filesTouched).toBe(1);
    expect(report.files[0]?.status).toBe("would-update");
    expect(after).toEqual(before);
    expect(after.schemaVersion).toBeUndefined();
  });

  it("live run migrates payloads to target schemaVersion with valid JSON output", async () => {
    const report = await runGuideContentMigrations({
      localesRoot: rootDir,
      locales: ["en"],
      fromVersion: 1,
      toVersion: 2,
      dryRun: false,
    });

    const updated = readJson<Record<string, unknown>>(guidePath);
    expect(report.summary.filesTouched).toBe(1);
    expect(report.files[0]?.status).toBe("updated");
    expect(updated.schemaVersion).toBe(2);
    expect(updated.seo).toEqual({
      title: "History Positano",
      description: "Guide description",
    });
  });

  it("fails with actionable error on unsupported migration path", async () => {
    await expect(
      runGuideContentMigrations({
        localesRoot: rootDir,
        locales: ["en"],
        fromVersion: 2,
        toVersion: 3,
        dryRun: true,
      }),
    ).rejects.toThrow(
      "Unsupported migration path: missing transform from v2 toward v3.",
    );
  });

  it("is idempotent when rerun at the target version", async () => {
    await runGuideContentMigrations({
      localesRoot: rootDir,
      locales: ["en"],
      fromVersion: 1,
      toVersion: 2,
      dryRun: false,
    });

    const rerunReport = await runGuideContentMigrations({
      localesRoot: rootDir,
      locales: ["en"],
      fromVersion: 2,
      toVersion: 2,
      dryRun: false,
    });

    expect(rerunReport.summary.filesTouched).toBe(0);
    expect(rerunReport.summary.filesUnchanged).toBe(1);
    expect(rerunReport.files[0]?.status).toBe("unchanged");
  });
});
