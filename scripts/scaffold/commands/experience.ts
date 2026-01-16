import fs from "node:fs/promises";
import path from "node:path";
import type { Argv, ArgumentsCamelCase } from "yargs";

import type { GuideArea, GuideManifestEntryInput } from "../../../src/routes/guides/guide-manifest";

import {
  ROOT,
  writeJson,
  kebab,
  toManifestStatus,
  normalizeGuideArea,
  toIndexStatus,
  updateGuideStatusInIndex,
  appendGuideManifestEntry,
  GuideWorkflowStatus,
  buildDefaultChecklist,
} from "../lib/utils";

type ExperienceArgs = {
  key: string;
  status?: GuideWorkflowStatus;
  area?: GuideArea;
  slug?: string;
  dryRun: boolean;
};

type ExperienceRouteArgs = {
  key: string;
  slug: string;
  dryRun: boolean;
};

export function registerExperienceCommands<T>(yargs: Argv<T>): Argv<T> {
  return yargs
    .command(
      "experience",
      "Seed EN content and manifest entry for an experience guide",
      (cmd) =>
        cmd
          .option("key", { type: "string", demandOption: true })
          .option("status", { choices: ["draft", "review", "published"] as const })
          .option("slug", { type: "string", describe: "Override slug (defaults to kebab-case key)" })
          .option("area", { choices: ["experience", "help", "howToGetHere"] as const })
          .option("dry-run", { type: "boolean", default: false }),
      async (argv) => {
        await scaffoldExperience(argv as ArgumentsCamelCase<ExperienceArgs>);
      },
    )
    .command(
      ["experience:route", "experience-route"],
      "Generate the route wrapper for an existing experience guide",
      (cmd) =>
        cmd
          .option("key", { type: "string", demandOption: true })
          .option("slug", { type: "string", demandOption: true })
          .option("dry-run", { type: "boolean", default: false }),
      async (argv) => {
        await scaffoldExperienceRoute(argv as ArgumentsCamelCase<ExperienceRouteArgs>);
      },
    );
}

async function scaffoldExperience({ key, dryRun, status, area, slug }: ArgumentsCamelCase<ExperienceArgs>): Promise<void> {
  const enOutDir = path.join(ROOT, "src", "locales", "en", "guides", "content");
  await fs.mkdir(enOutDir, { recursive: true });
  const file = path.join(enOutDir, `${key}.json`);
  try {
    await fs.access(file);
    throw new Error(`Content already exists: ${path.relative(ROOT, file)}`);
  } catch {
    // ok
  }
  const seed = {
    intro: ["TODO-TRANSLATE"],
    sections: [
      { id: "overview", title: "Overview", body: ["TODO-TRANSLATE"] },
    ],
    faqs: [],
  };
  if (dryRun) {
    console.log(`Would write ${path.relative(ROOT, file)}`);
    return;
  }
  await writeJson(file, seed);
  console.log("✅ Scaffolded experience content:", path.relative(ROOT, file));

  if (status) {
    await updateGuideStatusInIndex(key, toIndexStatus(status), dryRun);
  }

  const resolvedSlug = slug ? kebab(slug) : kebab(key);
  const manifestStatus = toManifestStatus(status);
  const resolvedArea = normalizeGuideArea(area);
  const manifestEntry: GuideManifestEntryInput = {
    key,
    slug: resolvedSlug,
    contentKey: key,
    status: manifestStatus,
    draftPathSegment: `guides/${resolvedSlug}`,
    areas: [resolvedArea],
    primaryArea: resolvedArea,
    structuredData: ["Article"],
    blocks: [
      { type: "genericContent", options: { contentKey: key } },
      { type: "faq", options: { fallbackKey: key } },
    ],
    options: {
      showPlanChoice: true,
      showTagChips: true,
    },
    checklist: buildDefaultChecklist(),
  };
  await appendGuideManifestEntry(manifestEntry, dryRun);
}

async function scaffoldExperienceRoute({
  key,
  slug,
  dryRun,
}: ArgumentsCamelCase<ExperienceRouteArgs>): Promise<void> {
  const outDir = path.join(ROOT, "src", "routes", "guides");
  const normalizedSlug = kebab(slug);
  const file = path.join(outDir, `${normalizedSlug}.tsx`);
  const rel = path.relative(ROOT, file);

  try {
    await fs.access(file);
    throw new Error(`Route already exists: ${rel}`);
  } catch {
    // ok
  }

  const componentName = normalizedSlug
    .replace(/-([a-z])/g, (_, c) => (c as string).toUpperCase())
    .replace(/^([a-z])/, (m) => m.toUpperCase());

  const src = `// ${["src", "routes", "guides", `${normalizedSlug}.tsx`].join("/")}\n` +
    `import { memo } from "react";\n` +
    `import GuideSeoTemplate from "./_GuideSeoTemplate";\n` +
    `import type { GuideKey } from "@/routes.guides-helpers";\n\n` +
    `export const GUIDE_KEY = ${JSON.stringify(key)} as const satisfies GuideKey;\n` +
    `export const GUIDE_SLUG = ${JSON.stringify(normalizedSlug)} as const;\n\n` +
    `function ${componentName}(): JSX.Element {\n` +
    `  return <GuideSeoTemplate guideKey={GUIDE_KEY} metaKey={GUIDE_KEY} />;\n` +
    `}\n\n` +
    `export default memo(${componentName});\n`;

  if (dryRun) {
    console.log(`Would write ${rel}`);
    return;
  }
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(file, src, "utf8");
  console.log("✅ Scaffolded experience route:", rel);
}