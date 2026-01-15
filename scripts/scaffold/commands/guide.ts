import fs from "node:fs/promises";
import path from "node:path";
import type { Argv, ArgumentsCamelCase } from "yargs";

import type {
  GuideArea,
  GuideManifestEntryInput,
  GuideStatus,
  GuideKey,
} from "../../../src/routes/guides/guide-manifest";
import { guideManifest } from "../../../src/routes/guides/guide-manifest";
import type { GuideBlockType } from "../../../src/routes/guides/blocks/types";

import {
  GuideWorkflowStatus,
  ROOT,
  kebab,
  writeJson,
  appendGuideManifestEntry,
  buildManifestEntrySource,
  normalizeGuideArea,
  toManifestStatus,
  buildDefaultChecklist,
} from "../lib/utils";
import { buildGuideBlock, parseGuideBlockType, printGuideBlockCatalog } from "../templates/guide-blocks";
import { buildGuideContentSeed, buildGuideRouteSource, buildGuideTestSource } from "../templates/guide";
import {
  buildGuideMigrationManifestEntry,
  buildGuideMigrationRouteSource,
  normalizeGuideMigrationPattern,
  GUIDE_MIGRATION_PATTERNS,
  type GuideMigrationPattern,
} from "../templates/guide-migration";

type GuideArgs = {
  key: GuideKey;
  slug?: string;
  status?: GuideWorkflowStatus;
  area?: GuideArea;
  blocks?: string[];
  tags?: string[];
  dryRun: boolean;
  listBlocks?: boolean;
};

type GuideMigrateArgs = {
  key: GuideKey;
  slug?: string;
  status?: GuideWorkflowStatus;
  area?: GuideArea;
  pattern?: GuideMigrationPattern;
  related?: string[];
  structured?: string[];
  dryRun: boolean;
  noManifest?: boolean;
  force?: boolean;
};

export function registerGuideCommands<T>(yargs: Argv<T>): Argv<T> {
  return yargs
    .command(
      "guide",
      "Create a new guide scaffold (content seed, manifest entry, route, test)",
      (cmd) =>
        cmd
          .option("key", { type: "string", demandOption: true })
          .option("slug", { type: "string", describe: "Override slug (defaults to kebab-case key)" })
          .option("status", { choices: ["draft", "review", "published"] as const })
          .option("area", { choices: ["experience", "help", "howToGetHere"] as const })
          .option("blocks", {
            type: "string",
            array: true,
            describe: "Comma-separated block list (hero,genericContent,faq,...)",
            coerce: normalizeListOption,
          })
          .option("tags", {
            type: "string",
            array: true,
            describe: "AlsoHelpful tags for alsoHelpful block",
            coerce: normalizeListOption,
          })
          .option("dry-run", { type: "boolean", default: false })
          .option("list-blocks", { type: "boolean", default: false, describe: "Print the block catalog and exit" }),
      async (argv) => {
        const args = argv as ArgumentsCamelCase<GuideArgs>;
        if (args.listBlocks) {
          printGuideBlockCatalog();
          return;
        }
        await scaffoldGuide(args);
      },
    )
    .command(
      ["guide:migrate", "guides:migrate"],
      "Generate a migration-friendly route and manifest entry",
      (cmd) =>
        cmd
          .option("key", { type: "string", demandOption: true })
          .option("slug", { type: "string" })
          .option("pattern", { choices: GUIDE_MIGRATION_PATTERNS, default: "generic" })
          .option("status", { choices: ["draft", "review", "published"] as const })
          .option("area", { choices: ["experience", "help", "howToGetHere"] as const })
          .option("related", {
            type: "string",
            array: true,
            describe: "Comma-separated related guide keys",
            coerce: normalizeListOption,
          })
          .option("structured", {
            type: "string",
            array: true,
            describe: "Structured data types (Article,FAQPage,...)",
            coerce: normalizeListOption,
          })
          .option("dry-run", { type: "boolean", default: false })
          .option("no-manifest", { type: "boolean", default: false, describe: "Skip manifest updates" })
          .option("force", { type: "boolean", default: false, describe: "Overwrite existing route files" }),
      async (argv) => {
        await handleGuideMigrate(argv as ArgumentsCamelCase<GuideMigrateArgs>);
      },
    )
    .command(["guide:blocks", "guides:blocks", "blocks"], "List supported guide blocks", () => {}, () => {
      printGuideBlockCatalog();
    });
}

function normalizeListOption(input?: string[]): string[] | undefined {
  if (!input) return undefined;
  const values = input
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  return values.length > 0 ? values : undefined;
}

async function scaffoldGuide({
  key,
  slug,
  area,
  status,
  blocks,
  tags,
  dryRun,
}: ArgumentsCamelCase<GuideArgs>): Promise<void> {
  const trimmedKey = key.trim() as GuideKey;
  const resolvedSlug = slug ? kebab(slug) : kebab(trimmedKey);
  const resolvedArea = normalizeGuideArea(area);
  const manifestStatus = toManifestStatus(status);
  const rawBlocks = blocks && blocks.length > 0 ? blocks : ["hero", "genericContent", "faq"];

  const blockTypes = Array.from(new Set(rawBlocks.map((block) => parseGuideBlockType(block)))) as GuideBlockType[];
  const manifestBlocks = blockTypes.map((type) => buildGuideBlock(type, trimmedKey, resolvedSlug, tags));

  const manifestEntry: GuideManifestEntryInput = {
    key: trimmedKey,
    slug: resolvedSlug,
    contentKey: trimmedKey,
    status: manifestStatus,
    draftPathSegment: `guides/${resolvedSlug}`,
    areas: [resolvedArea],
    primaryArea: resolvedArea,
    structuredData: ["Article"],
    relatedGuides: [],
    blocks: manifestBlocks,
    options: {
      showTagChips: true,
      showPlanChoice: blockTypes.includes("planChoice"),
      showTransportNotice: blockTypes.includes("transportNotice"),
    },
    checklist: buildDefaultChecklist(),
  };

  if (guideManifest[trimmedKey]) {
    throw new Error(`Guide manifest already contains ${trimmedKey}`);
  }

  const contentSeed = buildGuideContentSeed(trimmedKey, blockTypes);
  const contentFile = path.join(ROOT, "src", "locales", "en", "guides", "content", `${trimmedKey}.json`);
  const routeDir = path.join(ROOT, "src", "routes", "guides");
  const routeFile = path.join(routeDir, `${resolvedSlug}.tsx`);
  const testDir = path.join(ROOT, "src", "routes", "guides", "__tests__");
  const testFile = path.join(testDir, `${resolvedSlug}.route.test.tsx`);

  if (dryRun) {
    console.log("Would scaffold guide route and manifest for", trimmedKey);
    console.log(` - ${path.relative(ROOT, contentFile)} (seed content)`);
    console.log(` - ${path.relative(ROOT, routeFile)} (route wrapper)`);
    console.log(` - ${path.relative(ROOT, testFile)} (route test stub)`);
    console.log(` - manifest entry for ${trimmedKey}`);
    return;
  }

  await fs.mkdir(path.dirname(contentFile), { recursive: true });
  try {
    await fs.access(contentFile);
    throw new Error(`Content already exists: ${path.relative(ROOT, contentFile)}`);
  } catch {
    await writeJson(contentFile, contentSeed);
    console.log("✅ Seeded EN content:", path.relative(ROOT, contentFile));
  }

  await appendGuideManifestEntry(manifestEntry, dryRun);

  await fs.mkdir(routeDir, { recursive: true });
  try {
    await fs.access(routeFile);
    throw new Error(`Route already exists: ${path.relative(ROOT, routeFile)}`);
  } catch {
    // ok
  }
  const routeSource = buildGuideRouteSource(trimmedKey, resolvedSlug);
  await fs.writeFile(routeFile, routeSource, "utf8");
  console.log("✅ Created route:", path.relative(ROOT, routeFile));

  await fs.mkdir(testDir, { recursive: true });
  try {
    await fs.access(testFile);
    throw new Error(`Test already exists: ${path.relative(ROOT, testFile)}`);
  } catch {
    // ok
  }
  const testSource = buildGuideTestSource(resolvedSlug, trimmedKey);
  await fs.writeFile(testFile, testSource, "utf8");
  console.log("✅ Added test stub:", path.relative(ROOT, testFile));
}

async function handleGuideMigrate({
  key,
  slug,
  status,
  area,
  pattern,
  related,
  structured,
  dryRun,
  noManifest,
  force,
}: ArgumentsCamelCase<GuideMigrateArgs>): Promise<void> {
  const trimmedKey = key.trim() as GuideKey;
  const resolvedSlug = slug ? kebab(slug) : kebab(trimmedKey);
  const resolvedPattern = normalizeGuideMigrationPattern(pattern);
  const resolvedArea = normalizeGuideArea(area);
  const manifestStatus = toManifestStatus(status) as GuideStatus;
  const relatedGuides = related ?? [];
  const structuredData = structured && structured.length > 0 ? structured : undefined;
  const routeDir = path.join(ROOT, "src", "routes", "guides");
  const routeFile = path.join(routeDir, `${resolvedSlug}.tsx`);
  const relativeRoute = path.relative(ROOT, routeFile);

  let routeExists = false;
  try {
    await fs.access(routeFile);
    routeExists = true;
  } catch {
    routeExists = false;
  }

  if (routeExists && !force) {
    throw new Error(`Route already exists: ${relativeRoute}. Use --force to overwrite.`);
  }

  const routeSource = buildGuideMigrationRouteSource({
    pattern: resolvedPattern,
    key: trimmedKey,
    slug: resolvedSlug,
  });

  if (dryRun) {
    console.log(`Would write ${relativeRoute}`);
  } else {
    await fs.mkdir(routeDir, { recursive: true });
    await fs.writeFile(routeFile, routeSource, "utf8");
    console.log(`${routeExists ? "♻️  Updated" : "✅ Created"} route: ${relativeRoute}`);
  }

  const manifestEntry = buildGuideMigrationManifestEntry({
    key: trimmedKey,
    slug: resolvedSlug,
    area: resolvedArea,
    status: manifestStatus,
    pattern: resolvedPattern,
    related: relatedGuides,
    structured: structuredData,
  });

  if (!noManifest) {
    await appendGuideManifestEntry(manifestEntry, dryRun);
  } else {
    const manifestSnippet = buildManifestEntrySource(manifestEntry);
    if (dryRun) {
      console.log("Manifest snippet:\n" + manifestSnippet);
    } else {
      console.log("ℹ️  Manifest update skipped (--no-manifest). Paste this entry manually if needed:\n" + manifestSnippet);
    }
  }

  if (resolvedPattern === "manual") {
    console.log("ℹ️  Manual pattern scaffolded. Fill in articleLead/articleExtras with curated content before enabling tests.");
  }
}