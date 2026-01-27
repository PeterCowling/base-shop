#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename -- Script writes within guides content directory */
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");

// Supported locales from i18n.config.ts
const SUPPORTED_LOCALES = [
  "en", "es", "de", "fr", "it", "ja", "ko", "pt", "ru", "zh",
  "ar", "hi", "vi", "pl", "sv", "no", "da", "hu"
];

const AREA_CHOICES = [
  { key: "experience", name: "Experiences", description: "Activities, beaches, dining, hiking" },
  { key: "help", name: "Assistance", description: "FAQs, policies, booking help" },
  { key: "howToGetHere", name: "How to Get Here", description: "Transport routes and directions" }
];

// Helper to slugify strings (simple implementation)
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function prompt(rl: ReturnType<typeof createInterface>, question: string, defaultValue?: string): Promise<string> {
  const suffix = defaultValue ? ` (default: ${defaultValue})` : "";
  const answer = await rl.question(`${question}${suffix}: `);
  return answer.trim() || defaultValue || "";
}

async function createContentStub(locale: string, guideKey: string, title: string): Promise<string> {
  const contentDir = path.join(appRoot, "src", "locales", locale, "guides", "content");
  const contentPath = path.join(contentDir, `${guideKey}.json`);

  // Check if file already exists
  try {
    await access(contentPath);
    return `⚠️  Skipped ${locale}: File already exists`;
  } catch {
    // File doesn't exist, create it
  }

  const scaffold = {
    seo: {
      title: locale === "en" ? title : `[${locale.toUpperCase()}] ${title}`,
      description: locale === "en" ? "" : `[Translation needed for ${locale}]`
    },
    linkLabel: locale === "en" ? title : `[${locale.toUpperCase()}] ${title}`,
    intro: {
      title: locale === "en" ? title : `[${locale.toUpperCase()}] ${title}`,
      body: locale === "en" ? "" : `[Translation needed for ${locale}]`
    },
    sections: [],
    faqs: []
  };

  await mkdir(contentDir, { recursive: true });
  await writeFile(contentPath, `${JSON.stringify(scaffold, null, 2)}\n`, "utf8");

  return `✅ Created ${locale}/guides/content/${guideKey}.json`;
}

async function addToGuidesIndex(guideKey: string, tags: string[], status: string): Promise<void> {
  const guidesIndexPath = path.join(appRoot, "src", "data", "guides.index.ts");
  let content = await readFile(guidesIndexPath, "utf8");

  // Find the GUIDES_INDEX_BASE array
  const arrayStart = content.indexOf("const GUIDES_INDEX_BASE: GuideIndexEntry[] = [");
  if (arrayStart === -1) {
    throw new Error("Could not find GUIDES_INDEX_BASE array in guides.index.ts");
  }

  // Find the first closing bracket after the array declaration
  const insertPosition = content.indexOf("];", arrayStart);
  if (insertPosition === -1) {
    throw new Error("Could not find end of GUIDES_INDEX_BASE array");
  }

  // Create the new entry
  const tagsStr = tags.length > 0 ? `["${tags.join('", "')}"]` : "[]";
  const statusStr = status !== "published" ? `, status: "${status}"` : "";
  const newEntry = `  { key: "${guideKey}", tags: ${tagsStr}${statusStr} },\n`;

  // Insert before the closing bracket
  content = content.slice(0, insertPosition) + newEntry + content.slice(insertPosition);

  await writeFile(guidesIndexPath, content, "utf8");
}

async function main() {
  const args = process.argv.slice(2);

  // Support both interactive and command-line modes for backward compatibility
  if (args.length >= 2) {
    // Legacy mode: pnpm create-guide <guideKey> <title>
    const [guideKey, title] = args;

    if (!/^[a-z][a-zA-Z0-9]*$/u.test(guideKey)) {
      console.error("Error: guideKey must be camelCase (e.g., myNewGuide)");
      process.exit(1);
    }

    const contentPath = path.join(appRoot, "src", "locales", "en", "guides", "content", `${guideKey}.json`);
    try {
      await access(contentPath);
      console.error(`Error: Guide "${guideKey}" already exists at ${contentPath}`);
      process.exit(1);
    } catch {
      // Continue
    }

    const scaffold = {
      seo: { title },
      linkLabel: title,
      intro: [],
      sections: [],
      faqs: []
    };

    const contentDir = path.join(appRoot, "src", "locales", "en", "guides", "content");
    await mkdir(contentDir, { recursive: true });
    await writeFile(contentPath, `${JSON.stringify(scaffold, null, 2)}\n`, "utf8");

    console.log(`✅ Created ${contentPath}`);
    console.log("\nNext steps (manual):");
    console.log("1) Add entry to guide manifest: apps/brikette/src/routes/guides/guide-manifest.ts");
    console.log("2) Update guide slug map if needed: apps/brikette/src/guides/slugs/");
    console.log("3) Add tag index entries if applicable: apps/brikette/src/routes/guides/tags");
    console.log("4) Translate content in other locales as needed");
    return;
  }

  // Interactive mode
  console.log("🎨 Create a new guide\n");

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    // 1. Guide key
    const guideKey = await prompt(rl, "Guide key (camelCase, e.g., myNewGuide)");
    if (!guideKey || !/^[a-z][a-zA-Z0-9]*$/u.test(guideKey)) {
      console.error("❌ Error: guideKey must be camelCase starting with lowercase letter");
      process.exit(1);
    }

    // Check if guide already exists
    const enContentPath = path.join(appRoot, "src", "locales", "en", "guides", "content", `${guideKey}.json`);
    try {
      await access(enContentPath);
      console.error(`❌ Error: Guide "${guideKey}" already exists`);
      process.exit(1);
    } catch {
      // Continue
    }

    // 2. Title
    const title = await prompt(rl, "Guide title (e.g., 'Path of the Gods Hike')");
    if (!title) {
      console.error("❌ Error: title is required");
      process.exit(1);
    }

    // 3. Slug (auto-generate from title, allow override)
    const defaultSlug = slugify(title);
    const slug = await prompt(rl, "URL slug", defaultSlug);

    // 4. Area (show choices)
    console.log("\nSelect guide area:");
    AREA_CHOICES.forEach((choice, i) => {
      console.log(`  ${i + 1}) ${choice.name} (${choice.key}) - ${choice.description}`);
    });
    const areaChoice = await prompt(rl, "Choice (1-3)", "1");
    const areaIndex = parseInt(areaChoice, 10) - 1;
    if (areaIndex < 0 || areaIndex >= AREA_CHOICES.length) {
      console.error("❌ Error: invalid area choice");
      process.exit(1);
    }
    const area = AREA_CHOICES[areaIndex]!.key;

    // 5. Tags (comma-separated)
    const tagsInput = await prompt(rl, "Tags (comma-separated, optional)");
    const tags = tagsInput
      ? tagsInput.split(",").map(t => t.trim()).filter(Boolean)
      : [];

    // 6. Status
    console.log("\nSelect status:");
    console.log("  1) draft (not yet published)");
    console.log("  2) review (ready for review)");
    console.log("  3) published (live on site)");
    const statusChoice = await prompt(rl, "Choice (1-3)", "1");
    const statusMap: Record<string, string> = { "1": "draft", "2": "review", "3": "published" };
    const status = statusMap[statusChoice] || "draft";

    rl.close();

    // Create content files
    console.log(`\n📝 Creating content files for ${SUPPORTED_LOCALES.length} locales...\n`);

    const results = await Promise.all(
      SUPPORTED_LOCALES.map(locale => createContentStub(locale, guideKey, title))
    );

    results.forEach(result => console.log(result));

    // Add to guides.index.ts
    console.log("\n📋 Adding to guides.index.ts...");
    await addToGuidesIndex(guideKey, tags, status);
    console.log("✅ Added to guides.index.ts");

    // Generate manifest entry snippet
    console.log("\n" + "=".repeat(80));
    console.log("📋 MANIFEST ENTRY (copy to guide-manifest.ts)");
    console.log("=".repeat(80));
    console.log(`
GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
  key: "${guideKey}",
  slug: "${slug}",
  contentKey: "${guideKey}",
  status: "${status === "published" ? "live" : status}",${status === "draft" ? `\n  draftPathSegment: "${AREA_CHOICES[areaIndex]!.name.toLowerCase()}/${slug}",` : ""}
  areas: ["${area}"],
  primaryArea: "${area}",
  structuredData: ["Article", "BreadcrumbList"],
  relatedGuides: [],
  blocks: [
    { type: "genericContent", options: { contentKey: "${guideKey}", showToc: true } }
  ],
  checklist: [
    { id: "translations", status: "inProgress" },
    { id: "content", status: "inProgress" }
  ]
}),
    `.trim());

    console.log("\n" + "=".repeat(80));
    console.log("\n✅ Guide scaffolding complete!\n");

    console.log("Next steps:");
    console.log(`1. Paste the manifest entry above into: src/routes/guides/guide-manifest.ts`);
    console.log(`2. Update English content: src/locales/en/guides/content/${guideKey}.json`);
    console.log(`3. Translate content for other locales (marked with [LOCALE] placeholders)`);
    console.log(`4. Test the guide at: http://localhost:3000/${status === "draft" ? "draft/" : ""}${area === "help" ? "assistance" : area === "experience" ? "experiences" : "how-to-get-here"}/${slug}`);
    console.log(`5. Run type check: pnpm typecheck\n`);

  } catch (error) {
    rl.close();
    console.error("❌ Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
