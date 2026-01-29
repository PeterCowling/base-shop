/**
 * SEO Audit Script for Guides
 *
 * Analyzes guide content for SEO quality and produces a 0-10 score with detailed recommendations.
 * Results are saved to guide-manifest-overrides.json.
 */

import fs from "fs/promises";
import path from "path";

import type { AppLanguage } from "../src/i18n.config";
import type { GuideKey } from "../src/guides/slugs/keys";
import { getGuideManifestEntry } from "../src/routes/guides/guide-manifest";
import type { SeoAuditResult } from "../src/routes/guides/guide-manifest-overrides";

type GuideContent = {
  seo?: {
    title?: string;
    description?: string;
  };
  intro?: string[];
  sections?: Array<{
    id?: string;
    title?: string;
    body?: string[];
  }>;
  faqs?: Array<{
    question?: string;
    answer?: string;
  }>;
  gallery?: unknown[];
};

/**
 * Count words in guide content across intro, sections, and FAQs.
 */
function countWords(content: GuideContent): number {
  let text = "";

  // Extract text from intro
  if (Array.isArray(content.intro)) {
    text += content.intro.join(" ");
  }

  // Extract text from sections
  if (Array.isArray(content.sections)) {
    for (const section of content.sections) {
      if (section.title) text += " " + section.title;
      if (Array.isArray(section.body)) {
        text += " " + section.body.join(" ");
      }
    }
  }

  // Extract text from FAQs
  if (Array.isArray(content.faqs)) {
    for (const faq of content.faqs) {
      if (faq.question) text += " " + faq.question;
      if (faq.answer) text += " " + faq.answer;
    }
  }

  // Count words (split by whitespace, filter empty)
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

/**
 * Count headings in guide content (section titles are H2s).
 */
function countHeadings(content: GuideContent): number {
  let count = 0;

  // Count section titles as H2s
  if (Array.isArray(content.sections)) {
    count += content.sections.filter((s) => s.title).length;
  }

  return count;
}

/**
 * Count internal links in guide content using %LINK:guideKey|label% pattern.
 */
function countInternalLinks(content: GuideContent): number {
  let linkCount = 0;
  const linkPattern = /%LINK:([^|]+)\|([^%]+)%/g;

  // Scan intro
  if (Array.isArray(content.intro)) {
    for (const para of content.intro) {
      if (typeof para === "string") {
        const matches = para.matchAll(linkPattern);
        linkCount += Array.from(matches).length;
      }
    }
  }

  // Scan sections
  if (Array.isArray(content.sections)) {
    for (const section of content.sections) {
      if (Array.isArray(section.body)) {
        for (const para of section.body) {
          if (typeof para === "string") {
            const matches = para.matchAll(linkPattern);
            linkCount += Array.from(matches).length;
          }
        }
      }
    }
  }

  return linkCount;
}

/**
 * Count images in guide content (gallery + inline images).
 */
function countImages(content: GuideContent): number {
  let count = 0;

  // Count gallery images
  if (Array.isArray(content.gallery)) {
    count += content.gallery.length;
  }

  // Could also count inline images in content if needed
  // (not implemented in current content format)

  return count;
}

/**
 * Check if content includes freshness signals (years, dates).
 */
function hasFreshnessSignals(content: GuideContent): boolean {
  const yearPattern = /202[0-9]/; // Match years like 2020-2029
  let text = "";

  if (Array.isArray(content.intro)) {
    text += content.intro.join(" ");
  }

  if (Array.isArray(content.sections)) {
    for (const section of content.sections) {
      if (Array.isArray(section.body)) {
        text += " " + section.body.join(" ");
      }
    }
  }

  return yearPattern.test(text);
}

/**
 * Main audit function that analyzes guide SEO and produces a scored result.
 */
export async function auditGuideSeo(
  guideKey: GuideKey,
  locale: AppLanguage = "en",
): Promise<SeoAuditResult> {
  // 1. Validate guide exists
  const manifest = getGuideManifestEntry(guideKey);
  if (!manifest) {
    throw new Error(`Guide not found: ${guideKey}`);
  }

  // 2. Load guide content
  // Detect if we're in repo root or app directory
  const cwd = process.cwd();
  const inAppDir = cwd.endsWith("/apps/brikette") || cwd.endsWith("\\apps\\brikette");
  const baseDir = inAppDir ? cwd : path.join(cwd, "apps/brikette");

  const contentPath = path.join(
    baseDir,
    "src/locales",
    locale,
    "guides/content",
    `${guideKey}.json`,
  );

  let content: GuideContent;
  try {
    const raw = await fs.readFile(contentPath, "utf-8");
    content = JSON.parse(raw) as GuideContent;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        `Content file not found: ${contentPath}\nEnsure the guide has content for locale "${locale}".`,
      );
    }
    throw new Error(`Failed to parse content file: ${(err as Error).message}`);
  }

  // 3. Extract metrics
  const metrics = {
    metaTitleLength: content.seo?.title?.length ?? 0,
    metaDescriptionLength: content.seo?.description?.length ?? 0,
    contentWordCount: countWords(content),
    headingCount: countHeadings(content),
    internalLinkCount: countInternalLinks(content),
    faqCount: content.faqs?.length ?? 0,
    imageCount: countImages(content),
  };

  // 4. Apply scoring rubric
  let score = 10.0;
  const issues: string[] = [];
  const improvements: string[] = [];
  const strengths: string[] = [];

  // Meta title
  if (!content.seo?.title) {
    score -= 1.0;
    issues.push("Missing meta title");
  } else if (metrics.metaTitleLength < 40) {
    score -= 0.5;
    improvements.push(
      `Meta title too short (${metrics.metaTitleLength} chars, target 40-60)`,
    );
  } else if (metrics.metaTitleLength > 60) {
    score -= 0.5;
    improvements.push(
      `Meta title too long (${metrics.metaTitleLength} chars, target 40-60)`,
    );
  } else {
    strengths.push(`Good meta title length (${metrics.metaTitleLength} chars)`);
  }

  // Meta description
  if (!content.seo?.description) {
    score -= 1.0;
    issues.push("Missing meta description");
  } else if (metrics.metaDescriptionLength < 140) {
    score -= 0.5;
    improvements.push(
      `Meta description too short (${metrics.metaDescriptionLength} chars, target 150-155)`,
    );
  } else if (metrics.metaDescriptionLength > 160) {
    score -= 0.5;
    improvements.push(
      `Meta description too long (${metrics.metaDescriptionLength} chars, target 150-155)`,
    );
  } else {
    strengths.push(
      `Good meta description length (${metrics.metaDescriptionLength} chars)`,
    );
  }

  // Content length
  if (metrics.contentWordCount < 1500) {
    score -= 1.0;
    issues.push(
      `Content too short (${metrics.contentWordCount} words, need 1500+)`,
    );
  } else if (metrics.contentWordCount < 2000) {
    score -= 0.5;
    improvements.push(
      `Content could be longer (${metrics.contentWordCount} words, target 2000+)`,
    );
  } else {
    strengths.push(`Good content length (${metrics.contentWordCount} words)`);
  }

  // Heading structure
  if (metrics.headingCount === 0) {
    score -= 0.5;
    issues.push("No section headings present");
  } else if (metrics.headingCount < 5) {
    score -= 0.5;
    improvements.push(
      `Few section headings (${metrics.headingCount}, recommend 5+)`,
    );
  } else {
    strengths.push(
      `Well-structured content with ${metrics.headingCount} headings`,
    );
  }

  // Internal links
  if (metrics.internalLinkCount < 3) {
    score -= 0.5;
    issues.push(
      `Only ${metrics.internalLinkCount} internal links, need 3+`,
    );
  } else if (metrics.internalLinkCount < 5) {
    score -= 0.3;
    improvements.push(
      `Add ${5 - metrics.internalLinkCount} more internal links (currently ${metrics.internalLinkCount})`,
    );
  } else {
    strengths.push(
      `Strong internal linking strategy (${metrics.internalLinkCount} links)`,
    );
  }

  // FAQs
  if (metrics.faqCount < 5) {
    score -= 0.5;
    issues.push(`Only ${metrics.faqCount} FAQs, need 5+`);
  } else if (metrics.faqCount < 8) {
    score -= 0.3;
    improvements.push(
      `Add ${8 - metrics.faqCount} more FAQs (currently ${metrics.faqCount})`,
    );
  } else {
    strengths.push(
      `Comprehensive FAQ section with ${metrics.faqCount} questions`,
    );
  }

  // Images
  if (metrics.imageCount < 3) {
    score -= 0.5;
    improvements.push(
      `Add ${3 - metrics.imageCount} more images (currently ${metrics.imageCount})`,
    );
  } else if (metrics.imageCount < 5) {
    score -= 0.3;
    improvements.push(
      `Add ${5 - metrics.imageCount} more images to reach 5+ target (currently ${metrics.imageCount})`,
    );
  } else {
    strengths.push(`Rich media with ${metrics.imageCount} images`);
  }

  // Freshness signals
  if (!hasFreshnessSignals(content)) {
    score -= 0.3;
    improvements.push("Include year/date signals for freshness");
  } else {
    strengths.push("Content includes freshness signals (year/date references)");
  }

  // Structured data (check manifest declaration)
  const hasArticleSchema = manifest.structuredData.some((s) =>
    typeof s === "string" ? s === "Article" : s.type === "Article",
  );
  const hasItemListSchema = manifest.structuredData.some((s) =>
    typeof s === "string" ? s === "ItemList" : s.type === "ItemList",
  );

  if (!hasArticleSchema && !hasItemListSchema) {
    score -= 0.5;
    improvements.push("Add Article or ItemList structured data to manifest");
  } else {
    const schemaTypes = manifest.structuredData
      .map((s) => (typeof s === "string" ? s : s.type))
      .join(", ");
    strengths.push(`Structured data declared: ${schemaTypes}`);
  }

  // 5. Round score to 1 decimal place
  score = Math.round(score * 10) / 10;

  // 6. Return result
  return {
    timestamp: new Date().toISOString(),
    score,
    analysis: {
      strengths,
      criticalIssues: issues,
      improvements,
    },
    metrics,
    version: "1.0.0",
  };
}

/**
 * Save audit results to guide-manifest-overrides.json.
 */
export async function saveAuditResults(
  guideKey: GuideKey,
  results: SeoAuditResult,
): Promise<void> {
  // Detect if we're in repo root or app directory
  const cwd = process.cwd();
  const inAppDir = cwd.endsWith("/apps/brikette") || cwd.endsWith("\\apps\\brikette");
  const baseDir = inAppDir ? cwd : path.join(cwd, "apps/brikette");

  const overridesPath = path.join(
    baseDir,
    "src/data/guides/guide-manifest-overrides.json",
  );

  let overrides: Record<string, unknown>;
  try {
    const raw = await fs.readFile(overridesPath, "utf-8");
    overrides = JSON.parse(raw) as Record<string, unknown>;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      overrides = {};
    } else {
      throw new Error(`Failed to read overrides file: ${(err as Error).message}`);
    }
  }

  // Ensure guide entry exists
  if (!overrides[guideKey] || typeof overrides[guideKey] !== "object") {
    overrides[guideKey] = {};
  }

  // Update audit results
  (overrides[guideKey] as Record<string, unknown>).auditResults = results;

  // Write back to file
  await fs.writeFile(overridesPath, JSON.stringify(overrides, null, 2), "utf-8");
}

/**
 * Format audit results as a user-facing summary report.
 */
export function formatAuditSummary(guideKey: GuideKey, results: SeoAuditResult): string {
  const { score, analysis } = results;
  const emoji = score >= 9 ? "🟢" : score >= 7 ? "🟡" : "🔴";

  let summary = `## SEO Audit Results: ${guideKey}\n\n`;
  summary += `**Score: ${score.toFixed(1)}/10** ${emoji}\n\n`;

  if (analysis.strengths.length > 0) {
    summary += `### Strengths ✅\n`;
    for (const strength of analysis.strengths) {
      summary += `- ${strength}\n`;
    }
    summary += `\n`;
  }

  if (analysis.criticalIssues.length > 0) {
    summary += `### Critical Issues ❌\n`;
    for (const issue of analysis.criticalIssues) {
      summary += `- ${issue}\n`;
    }
    summary += `\n`;
  }

  if (analysis.improvements.length > 0) {
    summary += `### Improvements 💡\n`;
    for (const improvement of analysis.improvements) {
      summary += `- ${improvement}\n`;
    }
    summary += `\n`;
  }

  summary += `### Next Steps\n`;
  if (score >= 9.0) {
    summary += `✅ Guide meets SEO requirements and can be published to "live" status.\n\n`;
  } else {
    summary += `⚠️ Score must reach 9.0+ before publishing. Address the improvements listed above and re-run the audit.\n\n`;
  }

  summary += `Results saved to guide-manifest-overrides.json\n`;

  return summary;
}
