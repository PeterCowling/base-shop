/** @jest-environment node */

import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";

import {
  mapGuideStatus,
  migrateGuidesToCentral,
} from "../migrate-guides-to-central";

type ManifestEntry = {
  key: string;
  slug: string;
  contentKey: string;
  status?: "draft" | "review" | "live" | "published";
  areas?: string[];
  primaryArea?: string;
  blocks?: unknown[];
  relatedGuides?: string[];
  structuredData?: unknown[];
};

function writeContentFile(
  sourceRoot: string,
  locale: string,
  contentKey: string,
  content: unknown,
): void {
  const contentPath = path.join(
    sourceRoot,
    "locales",
    locale,
    "guides",
    "content",
    `${contentKey}.json`,
  );
  mkdirSync(path.dirname(contentPath), { recursive: true });
  writeFileSync(contentPath, JSON.stringify(content, null, 2), "utf8");
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

describe("migrate-guides-to-central", () => {
  let sourceRoot: string;
  let targetRoot: string;
  const timestamp = "2026-02-09T12:00:00.000Z";

  const baseEntry: ManifestEntry = {
    key: "guideA",
    slug: "guide-a",
    contentKey: "guideA",
    status: "live",
    areas: ["help"],
    primaryArea: "help",
    blocks: [],
    relatedGuides: [],
    structuredData: [],
  };

  beforeEach(() => {
    sourceRoot = mkdtempSync(path.join(tmpdir(), "guides-source-"));
    targetRoot = mkdtempSync(path.join(tmpdir(), "guides-target-"));
  });

  afterEach(() => {
    rmSync(sourceRoot, { recursive: true, force: true });
    rmSync(targetRoot, { recursive: true, force: true });
  });

  it("maps live status to published", async () => {
    writeContentFile(sourceRoot, "en", "guideA", {
      seo: { title: "Title", description: "Description" },
    });

    await migrateGuidesToCentral({
      sourceRoot,
      targetRoot,
      manifestEntries: [baseEntry],
      locales: ["en"],
      timestamp,
      logger: () => undefined,
    });

    const guides = readJson<Array<{ status: string }>>(
      path.join(targetRoot, "brikette", "guides.json"),
    );
    expect(guides[0].status).toBe("published");
  });

  it("keeps draft status as draft", async () => {
    writeContentFile(sourceRoot, "en", "guideB", {
      seo: { title: "Title", description: "Description" },
    });

    await migrateGuidesToCentral({
      sourceRoot,
      targetRoot,
      manifestEntries: [{ ...baseEntry, key: "guideB", slug: "guide-b", contentKey: "guideB", status: "draft" }],
      locales: ["en"],
      timestamp,
      logger: () => undefined,
    });

    const guides = readJson<Array<{ status: string }>>(
      path.join(targetRoot, "brikette", "guides.json"),
    );
    expect(guides[0].status).toBe("draft");
  });

  it("assigns ULIDs and creates expected content directory structure", async () => {
    writeContentFile(sourceRoot, "en", "guideA", {
      seo: { title: "Title", description: "Description" },
    });

    await migrateGuidesToCentral({
      sourceRoot,
      targetRoot,
      manifestEntries: [baseEntry],
      locales: ["en"],
      timestamp,
      logger: () => undefined,
    });

    const guides = readJson<Array<{ id: string }>>(
      path.join(targetRoot, "brikette", "guides.json"),
    );
    expect(guides[0].id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);

    const targetContentPath = path.join(
      targetRoot,
      "brikette",
      "guides",
      "content",
      "guideA",
      "en.json",
    );
    const copiedContent = readJson<{ seo: { title: string } }>(targetContentPath);
    expect(copiedContent.seo.title).toBe("Title");
  });

  it("reports missing locale content without failing migration", async () => {
    writeContentFile(sourceRoot, "en", "guideA", {
      seo: { title: "Title", description: "Description" },
    });

    const summary = await migrateGuidesToCentral({
      sourceRoot,
      targetRoot,
      manifestEntries: [baseEntry],
      locales: ["en", "fr"],
      timestamp,
      logger: () => undefined,
    });

    expect(summary.missingContent).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "guideA", locale: "fr" }),
      ]),
    );
  });

  it("reports validation failures for invalid content payloads", async () => {
    writeContentFile(sourceRoot, "en", "guideA", {
      seo: { description: "Missing title" },
    });

    const summary = await migrateGuidesToCentral({
      sourceRoot,
      targetRoot,
      manifestEntries: [baseEntry],
      locales: ["en"],
      timestamp,
      logger: () => undefined,
    });

    expect(summary.validationFailures).toHaveLength(1);
    expect(summary.validationFailures[0].key).toBe("guideA");
  });

  it("is idempotent across repeated runs", async () => {
    writeContentFile(sourceRoot, "en", "guideA", {
      seo: { title: "Title", description: "Description" },
    });

    const options = {
      sourceRoot,
      targetRoot,
      manifestEntries: [baseEntry],
      locales: ["en"],
      timestamp,
      logger: () => undefined,
    };

    await migrateGuidesToCentral(options);
    const metadataPath = path.join(targetRoot, "brikette", "guides.json");
    const contentPath = path.join(
      targetRoot,
      "brikette",
      "guides",
      "content",
      "guideA",
      "en.json",
    );
    const firstMetadata = readFileSync(metadataPath, "utf8");
    const firstContent = readFileSync(contentPath, "utf8");

    await migrateGuidesToCentral(options);
    const secondMetadata = readFileSync(metadataPath, "utf8");
    const secondContent = readFileSync(contentPath, "utf8");

    expect(secondMetadata).toBe(firstMetadata);
    expect(secondContent).toBe(firstContent);
  });

  it("applies manifest overrides before migration", async () => {
    writeContentFile(sourceRoot, "en", "guideA", {
      seo: { title: "Title", description: "Description" },
    });

    await migrateGuidesToCentral({
      sourceRoot,
      targetRoot,
      manifestEntries: [baseEntry],
      overrides: {
        guideA: {
          status: "review",
          areas: ["experience"],
          primaryArea: "experience",
        },
      },
      locales: ["en"],
      timestamp,
      logger: () => undefined,
    });

    const guides = readJson<
      Array<{ status: string; areas: string[]; primaryArea: string }>
    >(path.join(targetRoot, "brikette", "guides.json"));

    expect(guides[0]).toEqual(
      expect.objectContaining({
        status: "review",
        areas: ["experience"],
        primaryArea: "experience",
      }),
    );
  });

  it("preserves nested optional fields and string whitespace in migrated content", async () => {
    const sourcePayload = {
      seo: {
        title: "  Ferry Times  ",
        description: "  Latest crossing updates  ",
        lastUpdated: "2026-02-01",
      },
      sections: [
        {
          id: "transport",
          title: "  Getting There  ",
          lastUpdated: "2026-01-31",
          images: [
            {
              src: "/img/ferry.jpg",
              alt: "Ferry at dock",
              aspectRatio: "16:9",
            },
          ],
        },
      ],
      faqs: [
        {
          q: "  Is this route seasonal?  ",
          a: "Yes, with reduced winter service.",
          linkLabel: "Read timetable",
        },
      ],
    };

    writeContentFile(sourceRoot, "en", "guideA", sourcePayload);

    await migrateGuidesToCentral({
      sourceRoot,
      targetRoot,
      manifestEntries: [baseEntry],
      locales: ["en"],
      timestamp,
      logger: () => undefined,
    });

    const migrated = readJson<unknown>(
      path.join(
        targetRoot,
        "brikette",
        "guides",
        "content",
        "guideA",
        "en.json",
      ),
    );

    expect(migrated).toEqual(sourcePayload);
  });
});

describe("mapGuideStatus", () => {
  it("maps live to published", () => {
    expect(mapGuideStatus("live")).toBe("published");
  });

  it("preserves draft and review", () => {
    expect(mapGuideStatus("draft")).toBe("draft");
    expect(mapGuideStatus("review")).toBe("review");
  });
});
