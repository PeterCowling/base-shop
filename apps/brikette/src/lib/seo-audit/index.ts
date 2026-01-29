/**
 * SEO Audit Script for Guides v3.1.0
 *
 * Analyzes guide content for SEO quality and produces a 0-10 score with detailed recommendations.
 * Results are saved to guide-manifest-overrides.json.
 *
 * v3.1.0 changes:
 * - Includes section.list text in all analyses (words, links, readability, entities, facts)
 * - Fixes early-answer logic (checks within first N words, not intro length)
 * - Fixes title nearFront bug (no more -1 < 30)
 * - Adds focusKeyword support (manifest.focusKeyword / manifest.primaryQuery). Keyword checks skipped if absent.
 * - Scopes "local specifics / facts / year refs / first-hand" by template (prevents help pages being mis-graded)
 * - Softens FAQ thresholds (prevents filler FAQs)
 * - Introduces publish gate based on blockers + score threshold (blockers are criticalIssues)
 */
import fs from "fs/promises";
import path from "path";

import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/guides/slugs/keys";
import {
  getGuideManifestEntry,
  type GuideManifestEntry,
  type GuideTemplate,
  type StructuredDataDeclaration,
} from "@/routes/guides/guide-manifest";
import type { SeoAuditResult } from "@/routes/guides/guide-manifest-overrides";

type GuideContent = {
  seo?: {
    title?: string;
    description?: string;
    image?: {
      width?: number;
      height?: number;
    };
  };
  lastUpdated?: string;
  intro?: string | string[];
  sections?: Array<{
    id?: string;
    title?: string;
    body?: string | string[];
    list?: string[];
    images?: Array<{
      src?: string;
      image?: string;
      alt?: string;
      caption?: string;
      width?: number;
      height?: number;
      sizeKB?: number;
      size?: number;
      format?: string;
      type?: string;
    }>;
  }>;
  faqs?: Array<{
    q?: string;
    a?: string | string[];
    question?: string;
    answer?: string | string[];
  }>;
  tips?: string[];
  warnings?: string[];
  essentialsSection?: { items?: string[] };
  costsSection?: { items?: string[] };
  callouts?: Record<string, string>;
  gallery?:
    | {
        title?: string;
        items?: Array<{
          image?: string;
          src?: string;
          alt?: string;
          caption?: string;
          sizeKB?: number;
          size?: number;
          width?: number;
          height?: number;
          format?: string;
          type?: string;
        }>;
      }
    | Array<{
        image?: string;
        src?: string;
        alt?: string;
        caption?: string;
        sizeKB?: number;
        size?: number;
        width?: number;
        height?: number;
        format?: string;
        type?: string;
      }>;
};

type Template = GuideTemplate;

type TemplateThresholds = {
  wordCount: { min: number; low: number; optimal: [number, number]; high?: number };
  images: { min: number; low: number; optimal: [number, number]; high?: number };
  links: { min: number; low?: number; optimal: [number, number]; high?: number };
  faqs: { min: number; low: number; optimal: [number, number] };
};

// ============================================================================
// CONFIG
// ============================================================================

/**
 * Publish gating:
 * - Blockers (analysis.criticalIssues) always prevent publishing.
 * - Score threshold is a quality threshold (soft gate).
 */
const PUBLISH_SCORE_THRESHOLD = 7.5;
const FEATURE_SCORE_THRESHOLD = 9.0;

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type TextSegment = { text: string; location: string };

function getTextSegments(content: GuideContent): TextSegment[] {
  const segments: TextSegment[] = [];

  const pushText = (text: unknown, location: string) => {
    if (typeof text !== "string") return;
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    segments.push({ text: trimmed, location });
  };

  const pushTextArray = (value: unknown, locationBase: string) => {
    if (typeof value === "string") {
      pushText(value, locationBase);
      return;
    }
    if (!Array.isArray(value)) return;
    value.forEach((p, i) => pushText(p, `${locationBase}[${i}]`));
  };

  pushTextArray(content.intro, "intro");

  if (Array.isArray(content.sections)) {
    content.sections.forEach((section, si) => {
      if (typeof section.title === "string" && section.title.trim().length > 0) {
        segments.push({ text: section.title, location: `sections[${si}].title` });
      }

      pushTextArray(section.body, `sections[${si}].body`);

      if (Array.isArray(section.list)) {
        section.list.forEach((li, lii) => {
          if (typeof li === "string" && li.trim().length > 0) {
            segments.push({ text: li, location: `sections[${si}].list[${lii}]` });
          }
        });
      }
    });
  }

  if (Array.isArray(content.faqs)) {
    content.faqs.forEach((faq, fi) => {
      pushText(faq.q ?? faq.question, `faqs[${fi}].question`);
      pushTextArray(faq.a ?? faq.answer, `faqs[${fi}].answer`);
    });
  }

  pushTextArray(content.tips, "tips");
  pushTextArray(content.warnings, "warnings");
  pushTextArray(content.essentialsSection?.items, "essentialsSection.items");
  pushTextArray(content.costsSection?.items, "costsSection.items");

  if (content.callouts && typeof content.callouts === "object") {
    Object.entries(content.callouts).forEach(([key, value]) => pushText(value, `callouts.${key}`));
  }

  // Gallery titles/captions can contain useful descriptive content and internal links.
  if (content.gallery && typeof content.gallery === "object" && !Array.isArray(content.gallery)) {
    pushText(content.gallery.title, "gallery.title");
    if (Array.isArray(content.gallery.items)) {
      content.gallery.items.forEach((item, i) => pushText(item.caption, `gallery.items[${i}].caption`));
    }
  }

  return segments;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract all text content from guide (for analysis purposes).
 */
function extractTextContent(content: GuideContent): string {
  return getTextSegments(content)
    .map((s) => s.text)
    .join(" ")
    .trim();
}

/**
 * Count words in guide content across intro, sections, lists, and FAQs.
 */
function countWords(content: GuideContent): number {
  const text = extractTextContent(content);
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

/**
 * Count headings in guide content (section titles are H2s).
 */
function countHeadings(content: GuideContent): number {
  if (!Array.isArray(content.sections)) return 0;
  return content.sections.filter((s) => s.title && s.title.trim().length > 0).length;
}

/**
 * Count H2 headings specifically.
 */
function countH2Headings(content: GuideContent): number {
  return countHeadings(content);
}

type InternalLink = { target: string; label: string; location: string };
const LINK_PATTERN = /%LINK:([^|%]+)\|([^%]+)%/g;

/**
 * Extract internal links from all text segments using %LINK:guideKey|label% pattern.
 */
function extractInternalLinks(content: GuideContent): InternalLink[] {
  const links: InternalLink[] = [];

  for (const seg of getTextSegments(content)) {
    for (const match of seg.text.matchAll(LINK_PATTERN)) {
      const target = (match[1] || "").trim();
      const label = (match[2] || "").trim();
      if (target.length > 0) {
        links.push({ target, label, location: seg.location });
      }
    }
  }

  return links;
}

/**
 * Validate internal link targets against the manifest.
 */
function validateInternalLinks(
  links: InternalLink[],
  currentGuideKey: GuideKey,
): { invalidTargets: string[]; invalidOccurrences: number; selfLinkCount: number } {
  const invalidTargets = new Set<string>();
  let invalidOccurrences = 0;
  let selfLinkCount = 0;

  for (const link of links) {
    if (link.target === currentGuideKey) {
      selfLinkCount++;
      continue;
    }

    const entry = getGuideManifestEntry(link.target as GuideKey);
    if (!entry) {
      invalidTargets.add(link.target);
      invalidOccurrences++;
    }
  }

  return { invalidTargets: Array.from(invalidTargets), invalidOccurrences, selfLinkCount };
}

/**
 * Count generic anchor text instances from %LINK labels.
 */
function countGenericAnchorsFromLinks(links: InternalLink[]): number {
  const generic = new Set([
    "here",
    "click here",
    "read more",
    "this link",
    "this page",
    "learn more",
  ]);

  let count = 0;
  for (const l of links) {
    const normalized = (l.label || "")
      .replace(/[\[\]().,!?]+/g, "")
      .trim()
      .toLowerCase();
    if (generic.has(normalized)) count++;
  }
  return count;
}

/**
 * Count images in guide content (gallery + inline images).
 */
type NormalizedGuideImage = {
  src: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  sizeKB?: number;
  size?: number;
  format?: string;
  type?: string;
};

function normalizeImageSrc(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getGalleryImages(content: GuideContent): NormalizedGuideImage[] {
  const out: NormalizedGuideImage[] = [];
  const gallery = content.gallery;
  if (!gallery) return out;

  // Array gallery: [{ src/image, alt, caption, ... }]
  if (Array.isArray(gallery)) {
    gallery.forEach((item) => {
      const src = normalizeImageSrc(item.src ?? item.image);
      if (!src) return;
      out.push({
        src,
        alt: item.alt,
        caption: item.caption,
        width: item.width,
        height: item.height,
        sizeKB: item.sizeKB,
        size: item.size,
        format: item.format,
        type: item.type,
      });
    });
    return out;
  }

  // Object gallery: { title, items: [{ image/src, alt, caption, ... }] }
  if (typeof gallery === "object" && Array.isArray(gallery.items)) {
    gallery.items.forEach((item) => {
      const src = normalizeImageSrc(item.src ?? item.image);
      if (!src) return;
      out.push({
        src,
        alt: item.alt,
        caption: item.caption,
        width: item.width,
        height: item.height,
        sizeKB: item.sizeKB,
        size: item.size,
        format: item.format,
        type: item.type,
      });
    });
  }

  return out;
}

function getSectionImages(content: GuideContent): NormalizedGuideImage[] {
  const out: NormalizedGuideImage[] = [];
  if (!Array.isArray(content.sections)) return out;
  content.sections.forEach((section) => {
    if (!Array.isArray(section.images)) return;
    section.images.forEach((item) => {
      const src = normalizeImageSrc(item.src ?? item.image);
      if (!src) return;
      out.push({
        src,
        alt: item.alt,
        caption: item.caption,
        width: item.width,
        height: item.height,
        sizeKB: item.sizeKB,
        size: item.size,
        format: item.format,
        type: item.type,
      });
    });
  });
  return out;
}

function getAllImages(content: GuideContent): NormalizedGuideImage[] {
  return [...getSectionImages(content), ...getGalleryImages(content)];
}

function countImages(content: GuideContent): number {
  return getAllImages(content).length;
}

/**
 * Check if content includes year/date references for freshness.
 */
function checkYearReferences(content: GuideContent): boolean {
  const allText = extractTextContent(content);
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const hasYear = allText.includes(String(currentYear)) || allText.includes(String(nextYear));
  const hasSeason = /\b(spring|summer|fall|autumn|winter|seasonal)\b/i.test(allText);

  return hasYear || hasSeason;
}

/**
 * Get first paragraph word count.
 */
function getFirstParagraphWordCount(content: GuideContent): number {
  if (!Array.isArray(content.intro) || content.intro.length === 0) return 0;
  const firstPara = content.intro[0];
  if (typeof firstPara !== "string") return 0;
  return firstPara.split(/\s+/).filter((w) => w.length > 0).length;
}

/**
 * Build a "lead text" slice (intro then earliest section content) capped at maxWords.
 */
function getLeadText(content: GuideContent, maxWords: number): string {
  const parts: string[] = [];
  let used = 0;

  const add = (chunk: string) => {
    const words = chunk.split(/\s+/).filter(Boolean);
    if (words.length === 0) return;

    const remaining = maxWords - used;
    if (remaining <= 0) return;

    if (words.length <= remaining) {
      parts.push(chunk);
      used += words.length;
    } else {
      parts.push(words.slice(0, remaining).join(" "));
      used += remaining;
    }
  };

  if (Array.isArray(content.intro)) {
    for (const p of content.intro) {
      if (typeof p === "string") add(p);
      if (used >= maxWords) return parts.join(" ").trim();
    }
  }

  if (Array.isArray(content.sections)) {
    for (const section of content.sections) {
      if (Array.isArray(section.body)) {
        for (const p of section.body) {
          if (typeof p === "string") add(p);
          if (used >= maxWords) return parts.join(" ").trim();
        }
      }
      if (Array.isArray(section.list)) {
        for (const li of section.list) {
          if (typeof li === "string") add(li);
          if (used >= maxWords) return parts.join(" ").trim();
        }
      }
      if (used >= maxWords) break;
    }
  }

  return parts.join(" ").trim();
}

/**
 * Check if answer appears early in content (within first 200 words).
 * Fixed: evaluates "presence within first N words" rather than requiring intro length <= N.
 */
function checkEarlyAnswer(content: GuideContent, template: Template): boolean {
  const lead = getLeadText(content, 200);
  if (!lead) return false;

  const lower = lead.toLowerCase();

  const patternsByTemplate: Record<Template, RegExp> = {
    help: /\b(how to|steps?|policy|rule|requirement|you can|you need|check[-\s]?in|check[-\s]?out|late|fee|deposit|passport|id|hours?)\b/i,
    experience: /\b(when|where|time|starts?|schedule|meet|join|cost|price|free|bring)\b/i,
    localGuide: /\b(how to get|getting there|minutes?|hours?|km|meters?|bus|train|ferry|metro|tram|ticket|price|€|\$|open|close)\b/i,
    pillar: /\b(itinerary|best|top|tips|how to get|getting there|minutes?|km|ticket|price|€|\$|open|close)\b/i,
  };

  const hasActionable = patternsByTemplate[template].test(lower);
  const hasConcrete =
    /\b\d{1,3}\s*(minutes?|hours?|km|meters?)\b/i.test(lower) ||
    /\b\d{1,2}:\d{2}\s*(am|pm)?\b/i.test(lower) ||
    /[€$£]/.test(lead);

  return hasActionable || hasConcrete;
}

/**
 * Detect placeholder content (TBD, lorem ipsum, empty sections).
 */
function detectPlaceholders(content: GuideContent): Array<{ type: string; location: string }> {
  const issues: Array<{ type: string; location: string }> = [];
  const allText = JSON.stringify(content);

  if (/lorem\s+ipsum/i.test(allText)) {
    issues.push({ type: "lorem", location: "content contains lorem ipsum placeholder text" });
  }

  const tbdMatches = allText.match(/\b(TBD|TODO|FIXME|XXX|PLACEHOLDER)\b/gi);
  if (tbdMatches) {
    tbdMatches.forEach((match) => {
      issues.push({ type: "tbd", location: `"${match}" marker found` });
    });
  }

  if (Array.isArray(content.sections)) {
    content.sections.forEach((section) => {
      const hasTitle = section.title && section.title.trim().length > 0;
      const hasBody =
        Array.isArray(section.body) &&
        section.body.length > 0 &&
        section.body.some((item) => typeof item === "string" && item.trim().length > 0);

      const hasList =
        Array.isArray(section.list) &&
        section.list.length > 0 &&
        section.list.some((item) => typeof item === "string" && item.trim().length > 0);

      if (hasTitle && !hasBody && !hasList) {
        issues.push({ type: "empty", location: `Section "${section.title}" has no content` });
      }

      if (Array.isArray(section.list) && section.list.length === 0) {
        issues.push({ type: "empty", location: `Section "${section.title}" has empty list` });
      }
    });
  }

  if (/\b(coming soon|more info soon|details tba|to be announced)\b/i.test(allText)) {
    issues.push({ type: "comingSoon", location: '"Coming soon" or similar placeholder found' });
  }

  return issues;
}

/**
 * Check spelling and grammar (basic checks).
 * Scoped: English-only (avoids false penalties in other locales).
 */
function checkSpellingGrammar(
  content: GuideContent,
  locale: AppLanguage,
): {
  totalErrors: number;
  errorRate: number;
  errors: Array<{ type: string; example: string }>;
} {
  if (locale !== "en") {
    return { totalErrors: 0, errorRate: 0, errors: [] };
  }

  const allText = extractTextContent(content);
  const wordCount = allText.split(/\s+/).filter((w) => w.length > 0).length;
  const errors: Array<{ type: string; example: string }> = [];

  const commonMisspellings: Record<string, string> = {
    accomodation: "accommodation",
    seperate: "separate",
    definately: "definitely",
    occured: "occurred",
    recieve: "receive",
    beleive: "believe",
    existance: "existence",
    occassion: "occasion",
    goverment: "government",
    enviroment: "environment",
    restaraunt: "restaurant",
    begining: "beginning",
    transfered: "transferred",
    untill: "until",
    sucessful: "successful",
  };

  Object.entries(commonMisspellings).forEach(([wrong, correct]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, "gi");
    const matches = allText.match(regex);
    if (matches) {
      matches.forEach(() => {
        errors.push({ type: "spelling", example: `"${wrong}" should be "${correct}"` });
      });
    }
  });

  const errorRate = wordCount > 0 ? (errors.length / wordCount) * 400 : 0;

  return {
    totalErrors: errors.length,
    errorRate,
    errors: errors.slice(0, 10),
  };
}

/**
 * Check image alt text coverage.
 */
function checkImageAltText(content: GuideContent): {
  coverage: number;
  total: number;
  withAlt: number;
} {
  let total = 0;
  let withAlt = 0;

  getAllImages(content).forEach((img) => {
    total++;
    if (typeof img.alt === "string" && (img.alt.trim().length > 0 || img.alt === "")) {
      withAlt++;
    }
  });

  const coverage = total > 0 ? (withAlt / total) * 100 : 100;
  return { coverage, total, withAlt };
}

/**
 * Check image file sizes.
 */
function checkImageSizes(content: GuideContent): { oversize: number; moderate: number; total: number } {
  let oversize = 0;
  let moderate = 0;
  let total = 0;

  getAllImages(content).forEach((img) => {
    const sizeKB = img.sizeKB || img.size || 0;
    if (!Number.isFinite(sizeKB) || sizeKB <= 0) return;
    total++;
    if (sizeKB > 500) oversize++;
    else if (sizeKB > 250) moderate++;
  });

  return { oversize, moderate, total };
}

/**
 * Check if modern image formats are used.
 */
function checkModernImageFormats(content: GuideContent): boolean {
  const images = getAllImages(content);
  if (images.length === 0) return true;

  return images.some((img) => {
    const format = (img.format || img.type || "").toLowerCase();
    const src = (img.src || "").toLowerCase().trim();
    return (
      format.includes("webp") ||
      format.includes("avif") ||
      src.endsWith(".webp") ||
      src.endsWith(".avif")
    );
  });
}

/**
 * Count local entities (places, landmarks).
 */
function countLocalEntities(content: GuideContent): number {
  const text = extractTextContent(content);

  const patterns = [
    /\b[A-Z][a-z]+\s+(Street|Road|Avenue|Piazza|Beach|Station|Stop|Port|Harbor)\b/g,
    /\b(Via|Piazza|Corso|Viale|Lungomare)\s+[A-Z][a-z]+/g,
    /\b[A-Z][a-z]+\s+(Hotel|Hostel|Restaurant|Bar|Café|Museum|Church|Cathedral)\b/g,
    /\b(SITA|bus\s+line|ferry\s+to|metro\s+line)\s+[A-Z0-9]+/gi,
  ];

  const uniqueMatches = new Set<string>();
  patterns.forEach((pattern) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      uniqueMatches.add(match[0]);
    }
  });

  return uniqueMatches.size;
}

/**
 * Count concrete facts per 500 words.
 */
function countConcreteFactsPer500Words(content: GuideContent): number {
  const text = extractTextContent(content);
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

  let factCount = 0;

  const numbers = text.match(/\b\d{1,3}(,\d{3})*(\.\d+)?\s*(minutes?|hours?|km|meters?|€|\$|£)\b/gi);
  if (numbers) factCount += numbers.length;

  const times = text.match(/\b\d{1,2}:\d{2}\s*(am|pm)?\b/gi);
  if (times) factCount += times.length;

  const properNames = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g);
  if (properNames) factCount += properNames.length * 0.5;

  const dates = text.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December|spring|summer|fall|autumn|winter)\b/gi,
  );
  if (dates) factCount += dates.length * 0.5;

  const factsPer500 = wordCount > 0 ? (factCount / wordCount) * 500 : 0;
  return Math.round(factsPer500);
}

/**
 * Detect first-hand details.
 */
function detectFirstHandDetails(content: GuideContent): boolean {
  const text = extractTextContent(content).toLowerCase();

  const firstHandPatterns = [
    /\b(we tried|we visited|we recommend|from our experience|when we stayed)\b/i,
    /\b(from the hostel|our hostel|our staff|reception recommend)\b/i,
    /\b(I visited|I tried|I walked|I took)\b/i,
    /\b(tip from|according to our|based on our)\b/i,
  ];

  return firstHandPatterns.some((pattern) => pattern.test(text));
}

/**
 * Calculate average paragraph length.
 */
function calculateAvgParagraphLength(content: GuideContent): number {
  const paragraphs: string[] = [];

  if (Array.isArray(content.intro)) paragraphs.push(...content.intro);

  if (Array.isArray(content.sections)) {
    content.sections.forEach((section) => {
      if (Array.isArray(section.body)) paragraphs.push(...section.body);
      if (Array.isArray(section.list)) paragraphs.push(...section.list);
    });
  }

  if (paragraphs.length === 0) return 0;

  const wordCounts = paragraphs.map((p) => {
    if (typeof p !== "string") return 0;
    return p.split(/\s+/).filter((w) => w.length > 0).length;
  });

  const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
  return Math.round(totalWords / paragraphs.length);
}

/**
 * Calculate average sentence length.
 */
function calculateAvgSentenceLength(content: GuideContent): number {
  const text = extractTextContent(content);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length === 0) return 0;

  const wordCounts = sentences.map((s) => s.split(/\s+/).filter((w) => w.length > 0).length);
  const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
  return Math.round(totalWords / sentences.length);
}

/**
 * Count syllables in a word (English-only heuristic).
 */
function countSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (cleaned.length <= 3) return 1;

  const vowels = "aeiouy";
  let count = 0;
  let previousWasVowel = false;

  for (let i = 0; i < cleaned.length; i++) {
    const isVowel = vowels.includes(cleaned[i]);
    if (isVowel && !previousWasVowel) count++;
    previousWasVowel = isVowel;
  }

  if (cleaned.endsWith("e")) count--;

  return Math.max(1, count);
}

/**
 * Calculate reading grade level (Flesch-Kincaid).
 * Scoped: English-only (returns undefined otherwise).
 */
function calculateReadingGrade(content: GuideContent, locale: AppLanguage): number | undefined {
  if (locale !== "en") return undefined;

  const text = extractTextContent(content);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);

  if (words.length === 0 || sentences.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  const grade = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
  return Math.max(0, Math.round(grade * 10) / 10);
}

/**
 * Get a focus keyword/primary query (preferred: manifest.focusKeyword).
 * If absent, returns null (keyword checks are skipped).
 */
function getFocusKeyword(manifest: Pick<GuideManifestEntry, "focusKeyword" | "primaryQuery">): string | null {
  const direct = [manifest.focusKeyword, manifest.primaryQuery].find(
    (v): v is string => typeof v === "string" && v.trim().length >= 3,
  );
  return direct?.trim() ?? null;
}

function checkFocusKeywordInTitle(
  title: string,
  focusKeyword: string,
): { present: boolean; nearFront: boolean } {
  const t = (title || "").toLowerCase();
  const k = focusKeyword.toLowerCase().trim();
  if (!k) return { present: false, nearFront: false };

  const idx = t.indexOf(k);
  return {
    present: idx >= 0,
    nearFront: idx >= 0 && idx < 30,
  };
}

function checkFocusKeywordInFirstNWords(
  content: GuideContent,
  focusKeyword: string,
  nWords: number,
): boolean {
  const slice = getLeadText(content, nWords).toLowerCase();
  const k = focusKeyword.toLowerCase().trim();
  if (!k) return false;
  return slice.includes(k);
}

/**
 * Calculate keyword stuffing rate (exact phrase) using focusKeyword when available.
 */
function calculateKeywordStuffingRate(content: GuideContent, focusKeyword: string | null): number {
  if (!focusKeyword) return 0;

  const text = extractTextContent(content).toLowerCase();
  const totalWords = text.split(/\s+/).filter((w) => w.length > 0).length;
  if (totalWords === 0) return 0;

  const phrase = focusKeyword.trim().toLowerCase();
  if (phrase.length < 3) return 0;

  const pattern = new RegExp(`(?:^|\\b)${escapeRegExp(phrase)}(?:\\b|$)`, "gi");
  const occurrences = (text.match(pattern) || []).length;

  const phraseWordCount = phrase.split(/\s+/).filter(Boolean).length || 1;
  const phraseRate = ((occurrences * phraseWordCount) / totalWords) * 100;

  return Math.round(phraseRate * 10) / 10;
}

function countMatches(text: string, pattern: RegExp): number {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const global = new RegExp(pattern.source, flags);
  return Array.from(text.matchAll(global)).length;
}

/**
 * Analyze CTAs (call-to-action elements).
 */
function analyzeCTAs(
  content: GuideContent,
): {
  hasPrimary: boolean;
  hasAboveFold: boolean;
  contextualCount: number;
} {
  const text = extractTextContent(content).toLowerCase();
  const intro = Array.isArray(content.intro) ? content.intro.join(" ").toLowerCase() : "";

  const ctaPatterns = [
    /\b(book now|check availability|reserve|join us|contact us|whatsapp|call reception)\b/i,
    /%LINK:[^|]+\|(book|reserve|contact|join)/i,
  ];

  const hasPrimary = ctaPatterns.some((pattern) => pattern.test(text));
  const hasAboveFold = ctaPatterns.some((pattern) => pattern.test(intro));

  const contextualPatterns = [
    /\b(from our hostel|from the hostel|walking distance from|our staff|ask reception)\b/i,
    /\b(book through us|we can arrange|we offer|available at reception)\b/i,
  ];

  const contextualCount = contextualPatterns.reduce((sum, pattern) => sum + countMatches(text, pattern), 0);
  return { hasPrimary, hasAboveFold, contextualCount };
}

// ============================================================================
// TEMPLATE THRESHOLDS (FAQ softened)
// ============================================================================

const TEMPLATE_THRESHOLDS: Record<Template, TemplateThresholds> = {
  help: {
    wordCount: { min: 600, low: 800, optimal: [800, 1400], high: 1800 },
    images: { min: 1, low: 2, optimal: [1, 4], high: 8 },
    links: { min: 3, optimal: [3, 8], high: 12 },
    faqs: { min: 0, low: 2, optimal: [2, 6] },
  },
  experience: {
    wordCount: { min: 1000, low: 1200, optimal: [1200, 2200] },
    images: { min: 6, low: 8, optimal: [8, 15] },
    links: { min: 3, low: 5, optimal: [5, 10] },
    faqs: { min: 0, low: 2, optimal: [2, 6] },
  },
  localGuide: {
    wordCount: { min: 1600, low: 2000, optimal: [2000, 3200] },
    images: { min: 8, low: 10, optimal: [10, 20] },
    links: { min: 5, low: 8, optimal: [8, 15] },
    faqs: { min: 2, low: 4, optimal: [4, 10] },
  },
  pillar: {
    wordCount: { min: 2500, low: 3000, optimal: [3000, 5000] },
    images: { min: 12, low: 15, optimal: [15, 30] },
    links: { min: 10, low: 15, optimal: [15, 25] },
    faqs: { min: 3, low: 6, optimal: [6, 12] },
  },
};

/**
 * Determine template type from manifest and content.
 * Improvement: prefer explicit manifest.template when available.
 */
function determineTemplate(manifest: GuideManifestEntry, wordCount: number): Template {
  if (manifest.template) return manifest.template;

  const isPillarGuide =
    wordCount > 2500 ||
    manifest.relatedGuides.length >= 8;

  if (isPillarGuide) return "pillar";
  if (manifest.primaryArea === "help") return "help";
  if (manifest.primaryArea === "experience") return "experience";
  if (manifest.primaryArea === "howToGetHere") return "localGuide";

  return "localGuide";
}

function getStructuredDataType(declaration: StructuredDataDeclaration): string {
  return typeof declaration === "string" ? declaration : declaration.type;
}

// ============================================================================
// MAIN AUDIT FUNCTION
// ============================================================================

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
  const cwd = process.cwd();
  const inAppDir = cwd.endsWith("/apps/brikette") || cwd.endsWith("\\apps\\brikette");
  const baseDir = inAppDir ? cwd : path.join(cwd, "apps/brikette");

  const contentPath = path.join(baseDir, "src/locales", locale, "guides/content", `${guideKey}.json`);

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

  // 3. Determine template type
  const wordCount = countWords(content);
  const template = determineTemplate(manifest, wordCount);
  const thresholds = TEMPLATE_THRESHOLDS[template];

  // Template-scoped checks
  const timeSensitive = manifest.timeSensitive ?? (template === "localGuide" || template === "pillar");

  const shouldCheckLocalSpecifics = template === "localGuide" || template === "pillar";
  const shouldCheckFirstHand = template === "experience" || template === "localGuide" || template === "pillar";
  const shouldCheckEarlyAnswer = template !== "experience"; // experiences can be more narrative

  // 4. Extract comprehensive metrics
  const focusKeyword = getFocusKeyword(manifest);

  const internalLinks = extractInternalLinks(content);
  const linkValidation = validateInternalLinks(internalLinks, guideKey);
  const genericAnchorCount = countGenericAnchorsFromLinks(internalLinks);

  const imageAltCoverage = checkImageAltText(content);
  const imageSizes = checkImageSizes(content);
  const placeholderIssues = detectPlaceholders(content);
  const spellingErrors = checkSpellingGrammar(content, locale);
  const h2Alignment = checkH2AlignmentToQueries(content);
  const ctaAnalysis = analyzeCTAs(content);

  const title = content.seo?.title || "";
  const keywordInTitle = focusKeyword
    ? checkFocusKeywordInTitle(title, focusKeyword)
    : { present: false, nearFront: false };

  const readingGradeLevel = calculateReadingGrade(content, locale);

  const metrics: Record<string, number | undefined> = {
    // Meta tags
    metaTitleLength: content.seo?.title?.length ?? 0,
    metaDescriptionLength: content.seo?.description?.length ?? 0,
    hasTitleTag: content.seo?.title ? 1 : 0,
    hasMetaDescription: content.seo?.description ? 1 : 0,

    // Content
    contentWordCount: wordCount,
    headingCount: countHeadings(content),
    h2Count: countH2Headings(content),
    hasH1: content.seo?.title ? 1 : 0,

    // Links & Media
    internalLinkCount: internalLinks.length,
    invalidInternalLinkOccurrences: linkValidation.invalidOccurrences,
    faqCount: content.faqs?.length ?? 0,
    imageCount: countImages(content),

    // HTML hygiene (lightweight — still mostly content-only)
    urlSlugLength: manifest.slug.length,
    hasOgTitle: content.seo?.title ? 1 : 0,
    hasOgDescription: content.seo?.description ? 1 : 0,
    hasOgImage: content.seo?.image || content.gallery?.[0] ? 1 : 0,

    // Content completeness
    firstParagraphLength: getFirstParagraphWordCount(content),
    hasEarlyAnswer: shouldCheckEarlyAnswer && checkEarlyAnswer(content, template) ? 1 : 0,
    hasPlaceholders: placeholderIssues.length > 0 ? 1 : 0,

    // Spell/grammar (en-only)
    errorRate: locale === "en" ? spellingErrors.errorRate : undefined,

    // Image quality
    imageAltCoverage: imageAltCoverage.coverage,
    imageAltTotal: imageAltCoverage.total,
    imageAltWithAlt: imageAltCoverage.withAlt,
    imageOversizeCount: imageSizes.oversize,
    imageModerateCount: imageSizes.moderate,
    featuredImageWidth: content.seo?.image?.width || content.gallery?.[0]?.width || 0,
    usesModernFormats: checkModernImageFormats(content) ? 1 : 0,

    // Content strategy (scoped)
    localEntityCount: shouldCheckLocalSpecifics ? countLocalEntities(content) : undefined,
    concreteFactsDensity: shouldCheckLocalSpecifics ? countConcreteFactsPer500Words(content) : undefined,
    hasFirstHandDetails: shouldCheckFirstHand && detectFirstHandDetails(content) ? 1 : 0,

    // Readability
    avgParagraphLength: calculateAvgParagraphLength(content),
    avgSentenceLength: calculateAvgSentenceLength(content),
    readingGradeLevel,

    // Keyword optimization (scoped by focusKeyword presence)
    hasFocusKeyword: focusKeyword ? 1 : 0,
    focusKeywordInTitle: focusKeyword && keywordInTitle.present ? 1 : 0,
    focusKeywordNearFront: focusKeyword && keywordInTitle.nearFront ? 1 : 0,
    focusKeywordEarly: focusKeyword && checkFocusKeywordInFirstNWords(content, focusKeyword, 150) ? 1 : 0,
    h2AlignmentCount: h2Alignment.aligned,
    h2TotalCount: h2Alignment.total,
    keywordStuffingRate: calculateKeywordStuffingRate(content, focusKeyword),

    // Internal link quality
    genericAnchorCount,

    // Structured data (presence only; render-time validation should be a separate stage)
    hasBreadcrumbs: manifest.structuredData.some((s) => getStructuredDataType(s) === "BreadcrumbList") ? 1 : 0,
    hasArticleSchema: manifest.structuredData.some((s) => getStructuredDataType(s) === "Article") ? 1 : 0,

    // CTAs
    hasPrimaryCTA: ctaAnalysis.hasPrimary ? 1 : 0,
    hasAboveFoldCTA: ctaAnalysis.hasAboveFold ? 1 : 0,
    contextualCTACount: ctaAnalysis.contextualCount,

    // Freshness (scoped)
    hasLastUpdated: content.lastUpdated ? 1 : 0,
    hasYearReferences: timeSensitive && checkYearReferences(content) ? 1 : 0,
  };

  // 5. Scoring rubric
  let score = 10.0;
  const issues: Array<{ issue: string; impact: number }> = []; // blockers
  const improvements: Array<{ issue: string; impact: number }> = [];
  const strengths: string[] = [];

  // === BLOCKERS: link integrity ===
  if (linkValidation.invalidOccurrences > 0) {
    const impact = 1.0;
    score -= impact;
    issues.push({
      issue: `Invalid internal links: ${linkValidation.invalidOccurrences} occurrence(s) pointing to unknown guide keys (${linkValidation.invalidTargets.join(", ")})`,
      impact,
    });
  } else {
    strengths.push("All internal links resolve to valid guide keys");
  }

  // === META TAGS ===
  if (!content.seo?.title) {
    const impact = 1.0;
    score -= impact;
    issues.push({ issue: "Missing meta title", impact });
  } else {
    const len = metrics.metaTitleLength ?? 0;
    if (len < 35) {
      const impact = 0.4;
      score -= impact;
      improvements.push({ issue: `Meta title too short (${len} chars, target 35-65)`, impact });
    } else if (len > 65) {
      const impact = 0.4;
      score -= impact;
      improvements.push({ issue: `Meta title too long (${len} chars, target 35-65)`, impact });
    } else {
      strengths.push(`Good meta title length (${len} chars)`);
    }
  }

  // Meta description: keep as a blocker if you want strict gating; if not, downgrade to improvement.
  if (!content.seo?.description) {
    const impact = 0.8;
    score -= impact;
    issues.push({ issue: "Missing meta description", impact });
  } else {
    const len = metrics.metaDescriptionLength ?? 0;
    if (len < 120) {
      const impact = 0.3;
      score -= impact;
      improvements.push({ issue: `Meta description short (${len} chars, target ~120-170)`, impact });
    } else if (len > 170) {
      const impact = 0.3;
      score -= impact;
      improvements.push({ issue: `Meta description long (${len} chars, target ~120-170)`, impact });
    } else {
      strengths.push(`Good meta description length (${len} chars)`);
    }
  }

  // === PLACEHOLDERS (Blockers) ===
  if (placeholderIssues.length > 0) {
    const hasLoremIpsum = placeholderIssues.some((p) => p.type === "lorem");
    if (hasLoremIpsum) {
      const impact = 1.0;
      score -= impact;
      issues.push({ issue: "Lorem ipsum placeholder text found - replace with real content", impact });
    }

    const tbdCount = placeholderIssues.filter((p) => p.type === "tbd").length;
    if (tbdCount > 0) {
      const impact = Math.min(tbdCount * 0.5, 1.0);
      score -= impact;
      issues.push({
        issue: `${tbdCount} TBD/TODO marker${tbdCount > 1 ? "s" : ""} found - complete all sections before publishing`,
        impact,
      });
    }

    const emptyCount = placeholderIssues.filter((p) => p.type === "empty").length;
    if (emptyCount > 0) {
      const impact = Math.min(emptyCount * 0.3, 0.6);
      score -= impact;
      improvements.push({
        issue: `${emptyCount} empty section${emptyCount > 1 ? "s" : ""} - add content or remove`,
        impact,
      });
    }

    const comingSoonCount = placeholderIssues.filter((p) => p.type === "comingSoon").length;
    if (comingSoonCount > 0) {
      const impact = 0.3;
      score -= impact;
      improvements.push({ issue: '"Coming soon" placeholder found - complete content before publishing', impact });
    }
  } else {
    strengths.push("All content is finalized (no placeholders)");
  }

  // === WORD COUNT (Template-specific) ===
  if (wordCount < thresholds.wordCount.min) {
    const impact = 1.0;
    score -= impact;
    issues.push({
      issue: `Content too short (${wordCount} words, ${template} template needs ${thresholds.wordCount.min}+)`,
      impact,
    });
  } else if (wordCount < thresholds.wordCount.low) {
    const impact = 0.4;
    score -= impact;
    improvements.push({
      issue: `Content below optimal (${wordCount} words, target ${thresholds.wordCount.low}+ for ${template})`,
      impact,
    });
  } else if (thresholds.wordCount.high && wordCount > thresholds.wordCount.high) {
    const impact = 0.2;
    score -= impact;
    improvements.push({
      issue: `Content verbose (${wordCount} words, ${template} usually works best under ${thresholds.wordCount.high})`,
      impact,
    });
  } else {
    strengths.push(`${template === "help" ? "Concise" : "Comprehensive"} content at ${wordCount} words`);
  }

  // === IMAGES (Template-specific) ===
  if ((metrics.imageCount ?? 0) < thresholds.images.min) {
    const impact = template === "help" ? 0.3 : 0.5;
    score -= impact;
    improvements.push({
      issue: `Too few images (${metrics.imageCount}, ${template} template suggests ${thresholds.images.min}+)`,
      impact,
    });
  } else if ((metrics.imageCount ?? 0) < thresholds.images.low) {
    const impact = 0.2;
    score -= impact;
    improvements.push({
      issue: `Add ${thresholds.images.low - (metrics.imageCount ?? 0)} more images (currently ${metrics.imageCount}, target ${thresholds.images.low}+ for ${template})`,
      impact,
    });
  } else {
    strengths.push(`Good visual content with ${metrics.imageCount} images`);
  }

  // === INTERNAL LINKS (Template-specific) ===
  if ((metrics.internalLinkCount ?? 0) < thresholds.links.min) {
    const impact = 0.4;
    score -= impact;
    improvements.push({
      issue: `Too few internal links (${metrics.internalLinkCount}, ${template} needs ${thresholds.links.min}+)`,
      impact,
    });
  } else {
    strengths.push(`Strong internal linking with ${metrics.internalLinkCount} links`);
  }

  // === FAQs (Softened; template-specific) ===
  if ((metrics.faqCount ?? 0) < thresholds.faqs.min) {
    const impact = 0.2;
    score -= impact;
    improvements.push({
      issue: `Add FAQs if users commonly ask follow-ups (currently ${metrics.faqCount}, suggested ${thresholds.faqs.min}+)`,
      impact,
    });
  } else if ((metrics.faqCount ?? 0) < thresholds.faqs.low) {
    const impact = 0.15;
    score -= impact;
    improvements.push({
      issue: `Consider adding ${thresholds.faqs.low - (metrics.faqCount ?? 0)} more FAQ(s) (currently ${metrics.faqCount}, target ${thresholds.faqs.low}+ for ${template})`,
      impact,
    });
  } else if ((metrics.faqCount ?? 0) > 0) {
    strengths.push(`FAQ section present with ${metrics.faqCount} questions`);
  }

  // === HEADING STRUCTURE ===
  if ((metrics.headingCount ?? 0) === 0) {
    const impact = 0.5;
    score -= impact;
    improvements.push({ issue: "No section headings found (add H2 sections for skimmability)", impact });
  } else if ((metrics.headingCount ?? 0) < 3 && wordCount > 1000) {
    const impact = 0.3;
    score -= impact;
    improvements.push({
      issue: `Add more headings (${metrics.headingCount} found, suggest 5+ for ${wordCount} words)`,
      impact,
    });
  } else {
    strengths.push(`Well-structured with ${metrics.headingCount} section headings`);
  }

  // === CONTENT COMPLETENESS ===
  if (shouldCheckEarlyAnswer && !(metrics.hasEarlyAnswer === 1) && wordCount > 300) {
    const impact = 0.4;
    score -= impact;
    improvements.push({ issue: "No clear actionable info in first ~200 words (tighten the lead)", impact });
  } else if (shouldCheckEarlyAnswer && metrics.hasEarlyAnswer === 1) {
    strengths.push("Lead contains actionable info early");
  }

  if ((metrics.h2Count ?? 0) === 0 && wordCount > 500) {
    const impact = 0.4;
    score -= impact;
    improvements.push({ issue: "No H2 headings (content needs section breaks)", impact });
  }

  // === SPELLING & GRAMMAR (en-only) ===
  if (locale === "en") {
    if (spellingErrors.errorRate > 1.0) {
      const impact = 0.5;
      score -= impact;
      improvements.push({
        issue: `High typo rate (${spellingErrors.totalErrors} issue(s), ${spellingErrors.errorRate.toFixed(2)} per 400 words)`,
        impact,
      });
    } else if (spellingErrors.totalErrors === 0) {
      strengths.push("No common misspellings detected");
    }
  }

  // === IMAGE QUALITY & ACCESSIBILITY ===
  if (imageAltCoverage.coverage < 50) {
    const impact = 1.0;
    score -= impact;
    issues.push({
      issue: `Critical: Only ${imageAltCoverage.coverage.toFixed(0)}% of images have alt text`,
      impact,
    });
  } else if (imageAltCoverage.coverage < 100) {
    const impact = 0.3;
    score -= impact;
    improvements.push({
      issue: `${imageAltCoverage.coverage.toFixed(0)}% alt text coverage (target 100%)`,
      impact,
    });
  } else {
    strengths.push("All images have alt attributes");
  }

  if (imageSizes.oversize > 0) {
    const impact = 0.7;
    score -= impact;
    issues.push({
      issue: `${imageSizes.oversize} image${imageSizes.oversize > 1 ? "s" : ""} over 500KB (optimize before publishing)`,
      impact,
    });
  } else if (imageSizes.moderate > 2) {
    const impact = 0.25;
    score -= impact;
    improvements.push({
      issue: `${imageSizes.moderate} images over 250KB (optimize for better performance)`,
      impact,
    });
  }

  if ((metrics.featuredImageWidth ?? 0) > 0 && (metrics.featuredImageWidth ?? 0) < 1200) {
    const impact = 0.2;
    score -= impact;
    improvements.push({
      issue: `Featured image small (${metrics.featuredImageWidth}px, recommend ≥1200px for social sharing)`,
      impact,
    });
  }

  if ((metrics.usesModernFormats ?? 1) === 0 && imageAltCoverage.total > 0) {
    const impact = 0.1;
    score -= impact;
    improvements.push({ issue: "Consider using modern image formats (WebP/AVIF)", impact });
  }

  // === CONTENT STRATEGY (Template-scoped) ===
  if (shouldCheckLocalSpecifics) {
    const localEntityCount = metrics.localEntityCount ?? 0;
    if (localEntityCount < 3) {
      const impact = 0.4;
      score -= impact;
      improvements.push({
        issue: `Add local specificity (${localEntityCount} entities found, target 5+)`,
        impact,
      });
    } else if (localEntityCount >= 5) {
      strengths.push(`Good local specificity (${localEntityCount} entities detected)`);
    }

    const facts = metrics.concreteFactsDensity ?? 0;
    if (facts < 5) {
      const impact = 0.4;
      score -= impact;
      improvements.push({
        issue: `Add concrete facts (${facts} per 500 words, target 8+)`,
        impact,
      });
    } else if (facts >= 8) {
      strengths.push(`Good density of concrete details (${facts} facts per 500 words)`);
    }
  }

  if (shouldCheckFirstHand && (metrics.hasFirstHandDetails ?? 0) === 0) {
    const impact = 0.25;
    score -= impact;
    improvements.push({
      issue: 'Add first-hand details (staff tips, "from the hostel", "we tried")',
      impact,
    });
  } else if (shouldCheckFirstHand && (metrics.hasFirstHandDetails ?? 0) === 1) {
    strengths.push("Includes first-hand / on-the-ground details");
  }

  // === READABILITY ===
  if ((metrics.avgParagraphLength ?? 0) > 150) {
    const impact = 0.4;
    score -= impact;
    improvements.push({
      issue: `Paragraphs long (avg ${metrics.avgParagraphLength} words, target ≤120)`,
      impact,
    });
  } else if ((metrics.avgParagraphLength ?? 0) > 120) {
    const impact = 0.2;
    score -= impact;
    improvements.push({
      issue: `Break up paragraphs (avg ${metrics.avgParagraphLength} words, optimal ≤90-120)`,
      impact,
    });
  }

  if ((metrics.avgSentenceLength ?? 0) > 30) {
    const impact = 0.4;
    score -= impact;
    improvements.push({
      issue: `Sentences complex (avg ${metrics.avgSentenceLength} words, target ≤25)`,
      impact,
    });
  } else if ((metrics.avgSentenceLength ?? 0) > 25) {
    const impact = 0.2;
    score -= impact;
    improvements.push({
      issue: `Simplify sentences (avg ${metrics.avgSentenceLength} words, optimal ≤20-25)`,
      impact,
    });
  }

  if (typeof metrics.readingGradeLevel === "number") {
    if (metrics.readingGradeLevel > 12) {
      const impact = 0.4;
      score -= impact;
      improvements.push({
        issue: `Reading level high (grade ${metrics.readingGradeLevel}, target ~7-10)`,
        impact,
      });
    } else if (metrics.readingGradeLevel > 10) {
      const impact = 0.2;
      score -= impact;
      improvements.push({
        issue: `Simplify language (grade ${metrics.readingGradeLevel}, optimal ~7-10)`,
        impact,
      });
    }
  }

  // === KEYWORD OPTIMIZATION (focusKeyword-scoped) ===
  if (!focusKeyword) {
    const impact = 0.1;
    score -= impact;
    improvements.push({
      issue: "Add manifest.focusKeyword (or manifest.primaryQuery) to enable keyword-targeting checks",
      impact,
    });
  } else {
    if (!keywordInTitle.present || !keywordInTitle.nearFront) {
      const impact = 0.3;
      score -= impact;
      improvements.push({ issue: `Focus keyword should appear near front of title ("${focusKeyword}")`, impact });
    }

    if (!(metrics.focusKeywordEarly === 1)) {
      const impact = 0.3;
      score -= impact;
      improvements.push({ issue: `Include focus keyword in first ~150 words ("${focusKeyword}")`, impact });
    }

    const stuffing = metrics.keywordStuffingRate ?? 0;
    if (stuffing > 3) {
      const impact = 0.5;
      score -= impact;
      improvements.push({
        issue: `Possible keyword stuffing (${stuffing}% repetition of "${focusKeyword}", target ≤2%)`,
        impact,
      });
    } else if (stuffing > 2) {
      const impact = 0.25;
      score -= impact;
      improvements.push({
        issue: `Reduce keyword repetition (${stuffing}% repetition, optimal ≤2%)`,
        impact,
      });
    } else {
      strengths.push("No obvious keyword stuffing");
    }
  }

  // === LINK QUALITY ===
  if ((metrics.genericAnchorCount ?? 0) > 3) {
    const impact = 0.3;
    score -= impact;
    improvements.push({
      issue: `${metrics.genericAnchorCount} generic link labels ("click here"/"here") - use descriptive anchors`,
      impact,
    });
  } else if ((metrics.genericAnchorCount ?? 0) > 0) {
    const impact = 0.15;
    score -= impact;
    improvements.push({
      issue: `Replace ${metrics.genericAnchorCount} generic link label(s) with descriptive anchors`,
      impact,
    });
  }

  // === FRESHNESS (Template-scoped / timeSensitive) ===
  if (timeSensitive) {
    if (!content.lastUpdated) {
      const impact = 0.25;
      score -= impact;
      improvements.push({ issue: "Add lastUpdated date (time-sensitive guide)", impact });
    }
    if (!checkYearReferences(content)) {
      const impact = 0.15;
      score -= impact;
      improvements.push({ issue: "Include year/season references (time-sensitive guide)", impact });
    }
  } else {
    // Non-time-sensitive: lastUpdated is optional (small nudge only)
    if (!content.lastUpdated) {
      const impact = 0.05;
      score -= impact;
      improvements.push({ issue: "Optional: add lastUpdated date", impact });
    }
  }

  // === STRUCTURED DATA (presence only) ===
  if (!(metrics.hasArticleSchema === 1 || metrics.hasBreadcrumbs === 1)) {
    const impact = 0.15;
    score -= impact;
    improvements.push({ issue: "Consider adding BreadcrumbList and/or Article schema in manifest", impact });
  } else {
    strengths.push("Structured data declared in manifest");
  }

  // Sort by impact
  issues.sort((a, b) => b.impact - a.impact);
  improvements.sort((a, b) => b.impact - a.impact);

  // Round score
  score = Math.max(0, Math.min(10, Math.round(score * 10) / 10));

  return {
    timestamp: new Date().toISOString(),
    score,
    analysis: {
      strengths,
      criticalIssues: issues,
      improvements,
    },
    metrics,
    version: "3.1.0",
  };
}

/**
 * Check H2 alignment to queries.
 */
function checkH2AlignmentToQueries(content: GuideContent): { aligned: number; total: number } {
  if (!Array.isArray(content.sections)) return { aligned: 0, total: 0 };

  const h2s = content.sections.filter((s) => s.title).map((s) => s.title!);
  const total = h2s.length;

  const aligned = h2s.filter(
    (h) => h.match(/\b(how|what|where|when|why|which|best|top|guide|tips)\b/i) || h.split(/\s+/).length >= 3,
  ).length;

  return { aligned, total };
}

/**
 * Save audit results to guide-manifest-overrides.json.
 */
export async function saveAuditResults(guideKey: GuideKey, results: SeoAuditResult): Promise<void> {
  const cwd = process.cwd();
  const inAppDir = cwd.endsWith("/apps/brikette") || cwd.endsWith("\\apps\\brikette");
  const baseDir = inAppDir ? cwd : path.join(cwd, "apps/brikette");

  const overridesPath = path.join(baseDir, "src/data/guides/guide-manifest-overrides.json");

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

  if (!overrides[guideKey] || typeof overrides[guideKey] !== "object") {
    overrides[guideKey] = {};
  }

  (overrides[guideKey] as Record<string, unknown>).auditResults = results;

  await fs.writeFile(overridesPath, JSON.stringify(overrides, null, 2), "utf-8");
}

/**
 * Format audit results as a user-facing summary report.
 */
export function formatAuditSummary(guideKey: GuideKey, results: SeoAuditResult): string {
  const { score, analysis } = results;
  const blockers = analysis.criticalIssues?.length ?? 0;

  const canPublish = blockers === 0 && score >= PUBLISH_SCORE_THRESHOLD;
  const canFeature = blockers === 0 && score >= FEATURE_SCORE_THRESHOLD;

  const emoji = canFeature ? "🟢" : canPublish ? "🟡" : "🔴";

  let summary = `## SEO Audit Results: ${guideKey}\n\n`;
  summary += `**Score: ${score.toFixed(1)}/10** ${emoji}\n\n`;

  if (analysis.strengths.length > 0) {
    summary += `### Strengths ✅\n`;
    for (const strength of analysis.strengths) summary += `- ${strength}\n`;
    summary += `\n`;
  }

  if (analysis.criticalIssues.length > 0) {
    summary += `### Publish Blockers ❌ (sorted by impact)\n`;
    for (const { issue, impact } of analysis.criticalIssues) {
      summary += `- **[-${impact.toFixed(1)}]** ${issue}\n`;
    }
    summary += `\n`;
  }

  if (analysis.improvements.length > 0) {
    summary += `### Improvements 💡 (sorted by impact)\n`;
    for (const { issue, impact } of analysis.improvements) {
      summary += `- **[-${impact.toFixed(1)}]** ${issue}\n`;
    }
    summary += `\n`;
  }

  summary += `### Next Steps\n`;
  if (analysis.criticalIssues.length > 0) {
    summary += `❌ Cannot publish: resolve all blockers first.\n\n`;
  } else if (canFeature) {
    summary += `✅ Can publish (high quality). Eligible for featured placement.\n\n`;
  } else if (canPublish) {
    summary += `✅ Can publish. Not yet “featured” quality (aim for ${FEATURE_SCORE_THRESHOLD.toFixed(1)}+).\n\n`;
  } else {
    summary += `⚠️ Improve score to ${PUBLISH_SCORE_THRESHOLD.toFixed(1)}+ to publish.\n\n`;
  }

  summary += `Results saved to guide-manifest-overrides.json\n`;
  return summary;
}
