#!/usr/bin/env tsx
/**
 * Verification script for SEO audit score fix
 *
 * Tests that manifest overrides (including audit results) can be loaded
 * server-side and properly integrated into the checklist system.
 *
 * Run: pnpm tsx scripts/verify-audit-score-fix.ts
 */

import { loadGuideManifestOverridesFromFs } from "../src/routes/guides/guide-manifest-overrides.node";
import { buildGuideChecklist, getGuideManifestEntry } from "../src/routes/guides/guide-manifest";

console.log("🔍 Verifying SEO audit score fix...\n");

// 1. Load overrides from filesystem (server-side)
console.log("1. Loading manifest overrides from filesystem...");
const overrides = loadGuideManifestOverridesFromFs();
console.log(`   ✅ Loaded overrides for ${Object.keys(overrides).length} guides\n`);

// 2. Check a guide with audit results
const testGuideKey = "chiesaNuovaDepartures";
console.log(`2. Testing guide: ${testGuideKey}`);

const guideOverride = overrides[testGuideKey];
if (!guideOverride) {
  console.error(`   ❌ No override found for ${testGuideKey}`);
  process.exit(1);
}

if (!guideOverride.auditResults) {
  console.error(`   ❌ No audit results in override for ${testGuideKey}`);
  process.exit(1);
}

console.log(`   ✅ Found audit results: score ${guideOverride.auditResults.score}/10`);
console.log(`   ✅ Audit timestamp: ${guideOverride.auditResults.timestamp}`);
console.log(`   ✅ Critical issues: ${guideOverride.auditResults.analysis.criticalIssues.length}`);
console.log(`   ✅ Improvements: ${guideOverride.auditResults.analysis.improvements.length}`);
console.log(`   ✅ Strengths: ${guideOverride.auditResults.analysis.strengths.length}\n`);

// 3. Build checklist with overrides
console.log("3. Building checklist with overrides...");
const manifestEntry = getGuideManifestEntry(testGuideKey);
if (!manifestEntry) {
  console.error(`   ❌ No manifest entry found for ${testGuideKey}`);
  process.exit(1);
}

const checklist = buildGuideChecklist(manifestEntry, {
  includeDiagnostics: true,
  lang: "en",
  overrides,
});

console.log(`   ✅ Checklist built with ${checklist.items.length} items\n`);

// 4. Verify SEO audit item has score in note
console.log("4. Verifying SEO audit checklist item...");
const seoAuditItem = checklist.items.find((item) => item.id === "seoAudit");

if (!seoAuditItem) {
  console.error("   ❌ No seoAudit item in checklist");
  process.exit(1);
}

console.log(`   ✅ SEO audit item status: ${seoAuditItem.status}`);
console.log(`   ✅ SEO audit item note: ${seoAuditItem.note}`);

// Verify note contains score
if (!seoAuditItem.note?.includes("Score:")) {
  console.error(`   ❌ Note does not contain 'Score:' - got: ${seoAuditItem.note}`);
  process.exit(1);
}

const scoreMatch = seoAuditItem.note.match(/Score: ([\d.]+)\/10/);
if (!scoreMatch) {
  console.error(`   ❌ Could not parse score from note: ${seoAuditItem.note}`);
  process.exit(1);
}

const extractedScore = parseFloat(scoreMatch[1]);
console.log(`   ✅ Extracted score from note: ${extractedScore}/10`);

// Verify extracted score matches audit results
if (Math.abs(extractedScore - guideOverride.auditResults.score) > 0.01) {
  console.error(
    `   ❌ Score mismatch: note has ${extractedScore}, audit has ${guideOverride.auditResults.score}`
  );
  process.exit(1);
}

console.log(`   ✅ Score matches audit results\n`);

// 5. Verify diagnostics contain audit data
console.log("5. Verifying diagnostics contain audit data...");

if (!seoAuditItem.diagnostics?.seoAudit) {
  console.error("   ❌ No seoAudit in diagnostics");
  process.exit(1);
}

const diagnosticAudit = seoAuditItem.diagnostics.seoAudit;
console.log(`   ✅ Diagnostic audit score: ${diagnosticAudit.score}/10`);
console.log(`   ✅ Diagnostic audit has analysis: ${!!diagnosticAudit.analysis}`);
console.log(`   ✅ Diagnostic audit has metrics: ${!!diagnosticAudit.metrics}\n`);

// 6. Summary
console.log("=" .repeat(60));
console.log("✅ ALL CHECKS PASSED!");
console.log("=" .repeat(60));
console.log("\nThe fix successfully:");
console.log("  1. Loads overrides from filesystem (server-side)");
console.log("  2. Includes audit results in overrides");
console.log("  3. Injects audit results into checklist");
console.log("  4. Sets correct note with score");
console.log("  5. Provides diagnostics for detail view");
console.log("\nAudit scores should now display immediately on page load.");
