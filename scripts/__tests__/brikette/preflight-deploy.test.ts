/**
 * @jest-environment node
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import { type PreflightDeps,runBriketteDeployPreflight } from "../../src/brikette/preflight-deploy";

const REQUIRED_STATIC_ROUTE_FILES = [
  "apps/brikette/src/app/[lang]/book/page.tsx",
  "apps/brikette/src/app/[lang]/book-private-accommodations/page.tsx",
  "apps/brikette/src/app/[lang]/guides/[slug]/page.tsx",
  "apps/brikette/src/app/[lang]/help/[slug]/page.tsx",
];

const REQUIRED_DEPLOY_SUPPORT_FILES = [
  "apps/brikette/public/_redirects",
  "apps/brikette/functions/api/availability.js",
  "apps/brikette/scripts/normalize-static-export-localized-routes.ts",
  "apps/brikette/scripts/generate-static-export-redirects.ts",
];

function writeFile(root: string, relPath: string, content: string): void {
  const absPath = join(root, relPath);
  mkdirSync(dirname(absPath), { recursive: true });
  writeFileSync(absPath, content, "utf8");
}

function createValidFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "brikette-preflight-"));

  writeFile(
    root,
    "apps/brikette/wrangler.toml",
    `name = "brikette-staging"
main = ".open-next/worker.js"
compatibility_date = "2025-06-20"

[assets]
directory = ".open-next/assets"
binding = "ASSETS"
`,
  );

  writeFile(root, "apps/brikette/next.config.mjs", "export default {};\n");
  writeFile(
    root,
    "apps/brikette/src/app/robots.txt/route.ts",
    `export function GET(): Response {
  return new Response("User-agent: *");
}
`,
  );

  for (const relPath of REQUIRED_STATIC_ROUTE_FILES) {
    writeFile(
      root,
      relPath,
      `export function generateStaticParams() {
  return [];
}
`,
    );
  }

  for (const relPath of REQUIRED_DEPLOY_SUPPORT_FILES) {
    writeFile(root, relPath, "// fixture\n");
  }

  return root;
}

describe("runBriketteDeployPreflight", () => {
  it("TC-01: passes on valid static-export and deploy fixture", () => {
    const fixtureRoot = createValidFixture();
    try {
      const result = runBriketteDeployPreflight({ repoRoot: fixtureRoot });
      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it("TC-02: fails when required static-export route lacks generateStaticParams", () => {
    const fixtureRoot = createValidFixture();
    try {
      writeFile(
        fixtureRoot,
        "apps/brikette/src/app/[lang]/guides/[slug]/page.tsx",
        `export default function Page() { return null; }\n`,
      );

      const result = runBriketteDeployPreflight({ repoRoot: fixtureRoot });

      expect(result.ok).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "BRK_STATIC_MISSING_GENERATE_STATIC_PARAMS",
            path: "apps/brikette/src/app/[lang]/guides/[slug]/page.tsx",
          }),
        ]),
      );
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it("TC-03: fails when required deploy config field is missing", () => {
    const fixtureRoot = createValidFixture();
    try {
      writeFile(
        fixtureRoot,
        "apps/brikette/wrangler.toml",
        `name = "brikette-staging"
compatibility_date = "2025-06-20"

[assets]
directory = ".open-next/assets"
binding = "ASSETS"
`,
      );

      const result = runBriketteDeployPreflight({ repoRoot: fixtureRoot });

      expect(result.ok).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "BRK_DEPLOY_CONFIG_MISSING_FIELD",
            message: expect.stringContaining("main"),
          }),
        ]),
      );
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it("TC-04: returns stable internal-error envelope for unexpected runtime failures", () => {
    const fixtureRoot = createValidFixture();
    try {
      const failingDeps: PreflightDeps = {
        fs: {
          existsSync: () => true,
          readFileSync: () => {
            throw new Error("parser exploded");
          },
        },
      };

      const result = runBriketteDeployPreflight(
        { repoRoot: fixtureRoot },
        failingDeps,
      );

      expect(result.ok).toBe(false);
      expect(result.errors).toEqual([
        expect.objectContaining({
          code: "BRK_PREFLIGHT_INTERNAL",
          message: expect.stringContaining("parser exploded"),
        }),
      ]);
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});
