import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "../../../../../..");

const SSR_CRITICAL_FILES = [
  "packages/ui/src/organisms/RoomsSection.tsx",
  "apps/brikette/src/app/[lang]/experiences/ExperiencesPageContent.tsx",
  "apps/brikette/src/components/guides/GuideCollection.tsx",
  "apps/brikette/src/components/guides/GroupedGuideCollection.tsx",
  "apps/brikette/src/routes/how-to-get-here/useDestinationFilters.ts",
] as const;

describe("no-JS SSR bailout policy", () => {
  it("keeps useSearchParams out of SSR-critical routes/components", () => {
    for (const relativeFile of SSR_CRITICAL_FILES) {
      const abs = path.join(REPO_ROOT, relativeFile);
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads a curated allowlist of repo paths.
      const source = fs.readFileSync(abs, "utf8");

      expect(source).not.toMatch(/\buseSearchParams\b/u);
    }
  });
});
