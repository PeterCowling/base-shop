// scripts/seo/generate-guide-status.ts
// -----------------------------------------------------------------------------
// Generates the travel-guide implementation dashboards in docs/seo by analysing
// the live guides namespace for every locale. Run via `pnpm seo:guides-status`.
// -----------------------------------------------------------------------------

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import type { GuidesNamespace } from "../../src/locales/guides";
import { loadGuidesNamespaceFromFs } from "../../src/locales/_guides/node-loader";
import { listGuideManifestEntries } from "../../src/routes/guides/guide-manifest";
import { i18nConfig } from "../../src/i18n.config";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..", "..");
const DOCS_DIR = path.join(ROOT, "docs", "seo");

const GUIDE_HEADING = "### Guide Status Dashboard";
const STYLE_HEADING = "### Editorial style & tone";
const DEFAULT_STYLE_SECTION = [
  "- Voice: Friendly, practical, and second-person (“you”). Avoid marketing fluff; favour clarity over hype.",
  "- SEO: Lead with the primary keyword in titles, keep meta descriptions between 140–155 characters, and weave semantic variations naturally.",
  "- Accessibility: Describe images with alt text that conveys purpose (landmark names + context). Use sentence case for headings unless the proper noun dictates otherwise.",
  "- Measurements: Provide both metric and imperial equivalents where relevant; default to metric first.",
  "- Dates & times: Use “May–October”, “10:30 AM”, etc. Avoid ordinal numbers except for itinerary day headings.",
].join("\n");

type Counts = {
  intro: number;
  sections: number;
  faqs: number;
  tips: number;
};

type Row = {
  key: string;
  introLabel: string;
  sectionsLabel: string;
  faqsLabel: string;
  tipsLabel: string;
  status: string;
};

function toStringArray(value: unknown): string[] {
  if (typeof value === "string" && value.trim().length > 0) {
    return [value.trim()];
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter((entry) => entry.length > 0);
  }
  return [];
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeFaqs(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    // Some guides temporarily used `faq` as an object instead of an array.
    return [value];
  }
  return [];
}

function getGuideContent(namespace: GuidesNamespace | undefined, ...keys: (string | undefined)[]): Record<string, unknown> {
  const content = (namespace?.content ?? {}) as Record<string, unknown>;
  for (const key of keys) {
    if (!key) continue;
    const raw = content[key];
    if (raw && typeof raw === "object") {
      return raw as Record<string, unknown>;
    }
  }
  return {};
}

function countIntro(bundle: Record<string, unknown>): number {
  const intro = toStringArray(bundle.intro);
  return intro.length > 0 ? 1 : 0;
}

function countSections(bundle: Record<string, unknown>): number {
  return toArray(bundle.sections).length;
}

function countFaqs(bundle: Record<string, unknown>): number {
  const faqs = normalizeFaqs(bundle.faqs ?? bundle.faq);
  return faqs.length;
}

function countTips(bundle: Record<string, unknown>): number {
  return toArray(bundle.tips).length;
}

function formatIntro(enCount: number, localeCount: number): string {
  if (enCount === 0) return "n/a";
  return localeCount > 0 ? "yes" : "no";
}

function formatRatio(enCount: number, localeCount: number): string {
  return `${enCount}/${localeCount}`;
}

function buildStatus(enCounts: Counts, localeCounts: Counts): string {
  const gaps: string[] = [];
  if (enCounts.intro > 0 && localeCounts.intro === 0) {
    gaps.push("intro");
  }
  if (enCounts.sections > 0 && localeCounts.sections < enCounts.sections) {
    gaps.push(`sections (${localeCounts.sections}/${enCounts.sections})`);
  }
  if (enCounts.faqs > 0 && localeCounts.faqs < enCounts.faqs) {
    gaps.push(`faqs (${localeCounts.faqs}/${enCounts.faqs})`);
  }
  if (enCounts.tips > 0 && localeCounts.tips < enCounts.tips) {
    gaps.push(`tips (${localeCounts.tips}/${enCounts.tips})`);
  }

  if (gaps.length === 0) {
    const enTotal = enCounts.intro + enCounts.sections + enCounts.faqs + enCounts.tips;
    if (enTotal === 0) {
      const localeTotal = localeCounts.intro + localeCounts.sections + localeCounts.faqs + localeCounts.tips;
      return localeTotal > 0 ? "Locale ahead of EN source" : "Awaiting EN source";
    }
    return "Complete";
  }

  return `Needs ${gaps.join(", ")}`;
}

function computeCounts(bundle: Record<string, unknown>): Counts {
  return {
    intro: countIntro(bundle),
    sections: countSections(bundle),
    faqs: countFaqs(bundle),
    tips: countTips(bundle),
  };
}

function buildRows(
  manifestContentKeys: readonly { key: string; contentKey: string }[],
  englishNamespace: GuidesNamespace | undefined,
  localeNamespace: GuidesNamespace | undefined,
): Row[] {
  return manifestContentKeys.map(({ key, contentKey }) => {
    const enBundle = getGuideContent(englishNamespace, contentKey, key);
    const localeBundle = getGuideContent(localeNamespace, contentKey, key);
    const enCounts = computeCounts(enBundle);
    const localeCounts = computeCounts(localeBundle);

    return {
      key,
      introLabel: formatIntro(enCounts.intro, localeCounts.intro),
      sectionsLabel: formatRatio(enCounts.sections, localeCounts.sections),
      faqsLabel: formatRatio(enCounts.faqs, localeCounts.faqs),
      tipsLabel: formatRatio(enCounts.tips, localeCounts.tips),
      status: buildStatus(enCounts, localeCounts),
    };
  });
}

function renderTable(rows: Row[]): string {
  const header =
    "| Guide key | Intro | Sections (EN/locale) | FAQs (EN/locale) | Tips (EN/locale) | Status |\n" +
    "| --- | --- | ---: | ---: | ---: | --- |";
  const body = rows
    .map(
      (row) =>
        `| ${row.key} | ${row.introLabel} | ${row.sectionsLabel} | ${row.faqsLabel} | ${row.tipsLabel} | ${row.status} |`,
    )
    .join("\n");
  return `${header}\n${body}`;
}

async function updateDocument(locale: string, table: string, timestamp: string): Promise<void> {
  const fileName = `content-implementation-plan.${locale}.md`;
  const filePath = path.join(DOCS_DIR, fileName);

  let original: string;
  try {
    original = await fs.readFile(filePath, "utf8");
  } catch (error) {
    console.warn(`Skipping ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  const headingIndex = original.indexOf(GUIDE_HEADING);
  if (headingIndex === -1) {
    console.warn(`Skipping ${fileName}: unable to locate guide heading`);
    return;
  }

  const styleIndex = original.indexOf(STYLE_HEADING);
  const before = original.slice(0, headingIndex);
  const after =
    styleIndex === -1
      ? `\n${STYLE_HEADING}\n\n${DEFAULT_STYLE_SECTION}\n`
      : original.slice(styleIndex);
  const instructions =
    "Use this dashboard as the single source of next steps. Data refreshes automatically from the guides namespace.";
  const autoNote = `_Auto-generated via \`pnpm seo:guides-status\` on ${timestamp}._`;
  const block = `${GUIDE_HEADING}\n\n${instructions}\n\n<!-- GUIDE_STATUS:START -->\n${autoNote}\n\n${table}\n<!-- GUIDE_STATUS:END -->\n\n`;

  const nextContent = `${before}${block}${after}`;
  if (nextContent === original) {
    console.log(`No changes for ${fileName}`);
    return;
  }

  await fs.writeFile(filePath, nextContent, "utf8");
  console.log(`Updated ${path.relative(ROOT, filePath)} (${table.split("\n").length - 2} rows)`);
}

async function main(): Promise<void> {
  const englishNamespace = loadGuidesNamespaceFromFs("en", ROOT);
  if (!englishNamespace) {
    throw new Error("Unable to load English guides namespace");
  }

  const manifestEntries = listGuideManifestEntries().map((entry) => ({
    key: entry.key,
    contentKey: entry.contentKey,
  }));

  const timestamp = new Date().toISOString();
  for (const locale of i18nConfig.supportedLngs) {
    const namespace = locale === "en" ? englishNamespace : loadGuidesNamespaceFromFs(locale, ROOT);
    if (!namespace) {
      console.warn(`Skipping ${locale}: guides namespace missing`);
      continue;
    }
    const rows = buildRows(manifestEntries, englishNamespace, namespace);
    const table = renderTable(rows);
    await updateDocument(locale, table, timestamp);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});