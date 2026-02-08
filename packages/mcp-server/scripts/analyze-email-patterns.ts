#!/usr/bin/env node
/**
 * Email Pattern Analysis Script
 *
 * Reads a stage file from collect-baseline-sample.ts and runs each customer
 * email through draft_interpret (offline, no Gmail needed). Outputs:
 * - Category distribution
 * - Top question keywords
 * - Language split
 * - Uncovered patterns (emails that don't match any template)
 *
 * Usage:
 *   cd packages/mcp-server
 *   pnpm exec tsx scripts/analyze-email-patterns.ts ../../.agents/private/email-sample-stage-1.txt
 */

import * as fs from "node:fs";
import * as path from "node:path";

import handleDraftInterpretTool from "../src/tools/draft-interpret.js";

interface ParsedEmail {
  id: string;
  date: string;
  from: string;
  subject: string;
  snippet: string;
  body: string;
  threadContext: string[];
}

interface InterpretResult {
  normalized_text: string;
  language: string;
  intents: {
    questions: Array<{ text: string }>;
    requests: Array<{ text: string }>;
    confirmations: Array<{ text: string }>;
  };
  agreement: {
    status: string;
    confidence: number;
    requires_human_confirmation: boolean;
    additional_content: boolean;
  };
  workflow_triggers: {
    prepayment: boolean;
    terms_and_conditions: boolean;
    booking_monitor: boolean;
  };
  scenario: { category: string; confidence: number };
}

interface AnalysisResult {
  totalEmails: number;
  categoryDistribution: Record<string, number>;
  languageSplit: Record<string, number>;
  topKeywords: Array<{ keyword: string; count: number }>;
  lowConfidence: Array<{ id: string; subject: string; category: string; confidence: number }>;
  uncoveredPatterns: Array<{ id: string; subject: string; body: string; category: string }>;
  agreementEmails: Array<{ id: string; subject: string; status: string }>;
}

// Gmail message IDs are hex strings (16+ chars)
const MESSAGE_ID_RE = /^[0-9a-f]{16,}$/;

function parseStageFile(filePath: string): ParsedEmail[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  const emails: ParsedEmail[] = [];
  let inDetails = false;
  let current: Partial<ParsedEmail> | null = null;
  let inBody = false;

  for (const line of lines) {
    if (line.trim() === "EMAIL_DETAILS") {
      inDetails = true;
      continue;
    }

    if (!inDetails) continue;

    // New email starts with a message ID (hex string on its own line)
    if (MESSAGE_ID_RE.test(line.trim())) {
      if (current?.id) {
        emails.push(current as ParsedEmail);
      }
      current = {
        id: line.trim(),
        date: "",
        from: "",
        subject: "",
        snippet: "",
        body: "",
        threadContext: [],
      };
      inBody = false;
      continue;
    }

    if (!current) continue;

    // Detect field starts
    if (line.startsWith("- date: ")) { current.date = line.slice(8); inBody = false; }
    else if (line.startsWith("- from: ")) { current.from = line.slice(8); inBody = false; }
    else if (line.startsWith("- subject: ")) { current.subject = line.slice(11); inBody = false; }
    else if (line.startsWith("- snippet: ")) { current.snippet = line.slice(11); inBody = false; }
    else if (line.startsWith("- body: ")) { current.body = line.slice(8); inBody = true; }
    else if (line.startsWith("- thread_context:")) { inBody = false; }
    else if (line.startsWith("  [")) {
      inBody = false;
      current.threadContext = current.threadContext ?? [];
      current.threadContext.push(line.trim());
    }
    else if (inBody) {
      // Multi-line body continuation
      current.body = (current.body ?? "") + "\n" + line;
    }
  }

  if (current?.id) {
    emails.push(current as ParsedEmail);
  }

  return emails;
}

function extractKeywords(questions: Array<{ text: string }>): string[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "shall", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "about", "like",
    "through", "after", "over", "between", "out", "against", "during",
    "without", "before", "under", "around", "among", "and", "or", "but",
    "if", "then", "that", "this", "it", "its", "my", "your", "our",
    "their", "his", "her", "we", "you", "they", "i", "me", "us", "him",
    "them", "what", "which", "who", "when", "where", "how", "not", "no",
    "there", "here", "just", "also", "very", "often", "so", "too", "any",
  ]);

  const keywords: string[] = [];
  for (const q of questions) {
    const words = q.text.toLowerCase().replace(/[?.,!]/g, "").split(/\s+/);
    for (const word of words) {
      if (word.length > 2 && !stopWords.has(word)) {
        keywords.push(word);
      }
    }
  }
  return keywords;
}

// Template subjects from current email-templates.json
const _TEMPLATE_SUBJECTS = [
  "Why cancelled",
  "Alcohol Policy",
  "Transportation to Hostel Brikette",
  "Arriving before check-in time",
  "Essential - Inner Building, Opening Main Door",
  "Essential - Outer buildings, Opening Main Door",
  "Arrival Time - Hostel Brikette, Positano",
  "Change Credit Card Details",
  "Out of hours check-in",
  "Prepayment - Cancelled post 3rd Attempt",
  "Prepayment - 1st Attempt Failed (Octorate)",
  "Prepayment - 2nd Attempt Failed",
  "Prepayment - 1st Attempt Failed (Hostelworld)",
  "Cancellation of Non-Refundable Booking",
  "No Show",
  "Age Restriction",
  "Path of the Gods Hike - Recommended Routes",
  "Prepayment Successful",
  "Breakfast — Eligibility and Hours",
  "Breakfast — Not Included (OTA Booking)",
  "Luggage Storage — Before Check-in",
  "Luggage Storage — After Checkout",
  "Luggage Storage — Porter Service",
  "WiFi Information",
  "Booking Change — Date Modification",
  "Booking Change — Room Type",
  "Booking Extension Request",
  "Checkout Reminder",
  "Late Checkout Request",
  "Quiet Hours Reminder",
  "Visitor Policy",
  "Deposit and Keycard Info",
];

const TEMPLATE_CATEGORIES = new Set(
  ["booking-issues", "policies", "transportation", "check-in", "access",
   "payment", "prepayment", "cancellation", "activities", "breakfast",
   "luggage", "wifi", "booking-changes", "checkout", "house-rules"]
);

async function main(): Promise<void> {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: pnpm exec tsx scripts/analyze-email-patterns.ts <stage-file>");
    process.exit(1);
  }

  const resolvedPath = path.resolve(inputPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  console.error(`[Analyze] Reading: ${resolvedPath}`);
  const emails = parseStageFile(resolvedPath);
  console.error(`[Analyze] Parsed ${emails.length} emails`);

  if (emails.length === 0) {
    console.error("[Analyze] No emails to analyse.");
    return;
  }

  const result: AnalysisResult = {
    totalEmails: emails.length,
    categoryDistribution: {},
    languageSplit: {},
    topKeywords: [],
    lowConfidence: [],
    uncoveredPatterns: [],
    agreementEmails: [],
  };

  const allKeywords: string[] = [];

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    console.error(`[Analyze] Processing ${i + 1}/${emails.length}: ${email.id}`);

    try {
      const interpretResult = await handleDraftInterpretTool("draft_interpret", {
        body: email.body,
        subject: email.subject,
      });

      const payload = JSON.parse(
        (interpretResult as { content: Array<{ text: string }> }).content[0].text
      ) as InterpretResult;

      // Category distribution
      const cat = payload.scenario.category;
      result.categoryDistribution[cat] = (result.categoryDistribution[cat] ?? 0) + 1;

      // Language split
      const lang = payload.language;
      result.languageSplit[lang] = (result.languageSplit[lang] ?? 0) + 1;

      // Keywords from questions
      allKeywords.push(...extractKeywords(payload.intents.questions));

      // Low confidence
      if (payload.scenario.confidence < 70) {
        result.lowConfidence.push({
          id: email.id,
          subject: email.subject,
          category: cat,
          confidence: payload.scenario.confidence,
        });
      }

      // Uncovered patterns: category doesn't match any template category
      if (!TEMPLATE_CATEGORIES.has(cat)) {
        result.uncoveredPatterns.push({
          id: email.id,
          subject: email.subject,
          body: email.body.substring(0, 200),
          category: cat,
        });
      }

      // Agreement detection
      if (payload.agreement.status !== "none") {
        result.agreementEmails.push({
          id: email.id,
          subject: email.subject,
          status: payload.agreement.status,
        });
      }
    } catch (error) {
      console.error(`[Error] Failed to interpret ${email.id}: ${String(error)}`);
    }
  }

  // Compute top keywords
  const keywordCounts = new Map<string, number>();
  for (const kw of allKeywords) {
    keywordCounts.set(kw, (keywordCounts.get(kw) ?? 0) + 1);
  }
  result.topKeywords = Array.from(keywordCounts.entries())
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  // Output report
  console.info("\n========================================");
  console.info("  EMAIL PATTERN ANALYSIS REPORT");
  console.info("========================================\n");

  console.info(`Total emails analysed: ${result.totalEmails}\n`);

  console.info("--- CATEGORY DISTRIBUTION ---");
  const sortedCats = Object.entries(result.categoryDistribution)
    .sort(([, a], [, b]) => b - a);
  for (const [cat, count] of sortedCats) {
    const pct = ((count / result.totalEmails) * 100).toFixed(1);
    const covered = TEMPLATE_CATEGORIES.has(cat) ? "" : " [NO TEMPLATE]";
    console.info(`  ${cat}: ${count} (${pct}%)${covered}`);
  }

  console.info("\n--- LANGUAGE SPLIT ---");
  for (const [lang, count] of Object.entries(result.languageSplit).sort(([, a], [, b]) => b - a)) {
    console.info(`  ${lang}: ${count} (${((count / result.totalEmails) * 100).toFixed(1)}%)`);
  }

  console.info("\n--- TOP QUESTION KEYWORDS ---");
  for (const kw of result.topKeywords.slice(0, 20)) {
    console.info(`  ${kw.keyword}: ${kw.count}`);
  }

  if (result.lowConfidence.length > 0) {
    console.info(`\n--- LOW CONFIDENCE (${result.lowConfidence.length}) ---`);
    for (const lc of result.lowConfidence) {
      console.info(`  ${lc.id} | ${lc.subject} | ${lc.category} (${lc.confidence}%)`);
    }
  }

  if (result.uncoveredPatterns.length > 0) {
    console.info(`\n--- UNCOVERED PATTERNS (${result.uncoveredPatterns.length}) ---`);
    for (const up of result.uncoveredPatterns) {
      console.info(`  ${up.id} | ${up.subject} | category: ${up.category}`);
      console.info(`    ${up.body.substring(0, 100)}...`);
    }
  }

  if (result.agreementEmails.length > 0) {
    console.info(`\n--- AGREEMENT DETECTED (${result.agreementEmails.length}) ---`);
    for (const ae of result.agreementEmails) {
      console.info(`  ${ae.id} | ${ae.subject} | ${ae.status}`);
    }
  }

  console.info("\n========================================");
  console.info("  END OF REPORT");
  console.info("========================================\n");

  // Also output as JSON for programmatic use
  const jsonPath = resolvedPath.replace(/\.txt$/, "-analysis.json");
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));
  console.error(`[Analyze] JSON output written to: ${jsonPath}`);
  console.error(`[Analyze] Done.`);
}

main().catch(error => {
  console.error("[Fatal]", error);
  process.exit(1);
});
