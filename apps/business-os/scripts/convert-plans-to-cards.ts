#!/usr/bin/env tsx
/**
 * Convert docs/plans/*.md to Business OS cards in D1
 *
 * Usage:
 *   pnpm tsx scripts/convert-plans-to-cards.ts --dry-run  # Preview what would be created
 *   pnpm tsx scripts/convert-plans-to-cards.ts --commit   # Actually create cards in D1
 */

/* eslint-disable no-console, ds/no-hardcoded-copy */

import fs from "fs";
import matter from "gray-matter";
import path from "path";

// Types
interface PlanFrontmatter {
  Type: string;
  Status: string;
  Domain: string;
  Created?: string;
  "Last-updated"?: string;
  "Last-reviewed"?: string;
  "Feature-Slug"?: string;
  "Overall-confidence"?: string;
  [key: string]: unknown;
}

interface CardFrontmatter {
  Type: "Card";
  Lane: string;
  Priority: string;
  Owner: string;
  ID: string;
  Title?: string;
  Business?: string;
  Tags?: string[];
  Created?: string;
  Updated?: string;
}

// Status → Lane mapping (from feasibility analysis)
const STATUS_TO_LANE: Record<string, string> = {
  Draft: "Fact-finding",
  "Ready-for-planning": "Fact-finding",
  Active: "Planned",
  "In Progress": "In progress",
  Complete: "Done",
  Completed: "Done",
  Implemented: "Done",
  Superseded: "Done",
  Accepted: "Planned",
  Reference: "Done",
  Proposed: "Inbox",
};

// Domain → Business mapping (extended from feasibility analysis)
const DOMAIN_TO_BUSINESS: Record<string, string> = {
  "Business OS": "BOS",
  "Business OS / Kanban": "BOS",
  Platform: "PLAT",
  "Platform/UI": "PLAT",
  "Platform/Lib": "PLAT",
  "Platform/Infra": "PLAT",
  Repo: "PLAT",
  Build: "PLAT",
  "CI-Deploy": "PLAT",
  "CI/Infrastructure": "PLAT",
  Deploy: "PLAT",
  Infrastructure: "PLAT",
  "DevEx/Tooling": "PLAT",
  Testing: "PLAT",
  Launch: "PLAT",
  CMS: "BRIK",
  Brikette: "BRIK",
  "Brikette i18n": "BRIK",
  "Apps/Brikette": "BRIK",
  UI: "BRIK",
  "UI / CMS": "BRIK",
  "CMS / UI": "BRIK",
  "CMS / UI / Platform": "BRIK",
  "UI / i18n": "BRIK",
  "UI / i18n / Content": "BRIK",
  "UI / i18n / Testing": "BRIK",
  SEO: "BRIK",
  "Guides / Content / SEO": "BRIK",
  i18n: "BRIK",
  "i18n/CMS": "BRIK",
  Commerce: "PIPE",
  "Commerce / Sourcing / Market Intelligence / Capital Analytics / Ops Enablement": "PIPE",
  "Platform, Commerce": "PIPE",
  Prime: "PRIME",
  Reception: "RECEP",
  "Dashboard / Upgrade": "RECEP",
  Skylar: "SKYL",
  Theming: "BRIK",
  "Design System": "PLAT",
};

// Priority derivation from Status
function derivePriority(status: string): string {
  if (status === "In Progress") return "P0"; // Actively working
  if (status === "Active" || status === "Accepted") return "P1"; // Ready to start
  if (status === "Draft" || status === "Ready-for-planning") return "P2"; // Needs work
  return "P3"; // Backlog/reference
}

// Extract title from markdown content (first # heading)
function extractTitle(content: string): string | undefined {
  const match = content.match(/^#\s+(.+?)(?:\s+—.+)?$/m);
  if (match) {
    return match[1].trim();
  }
  return undefined;
}

// Humanize slug (kebab-case → Title Case)
function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Generate card ID from business and slug
const idCounters: Record<string, number> = {};

function generateCardId(business: string, _slug?: string): string {
  if (!idCounters[business]) {
    idCounters[business] = 1;
  }

  const num = idCounters[business]++;
  const paddedNum = num.toString().padStart(4, "0");

  // Use ENG prefix for engineering/feature work (vs OPP for opportunities)
  return `${business}-ENG-${paddedNum}`;
}

// Convert plan file to card
function convertPlanToCard(
  planPath: string,
  plansDir: string
): { card: CardFrontmatter; content: string; errors: string[] } | null {
  const errors: string[] = [];

  try {
    const fileContent = fs.readFileSync(planPath, "utf-8");
    const { data: frontmatter, content } = matter(fileContent);
    const plan = frontmatter as PlanFrontmatter;

    // Validate it's a plan
    if (plan.Type !== "Plan") {
      errors.push(`Not a Plan document (Type: ${plan.Type})`);
      return null;
    }

    // Get Status
    const status = plan.Status;
    if (!status) {
      errors.push("Missing Status field");
      return null;
    }

    // Map Status → Lane
    const lane = STATUS_TO_LANE[status];
    if (!lane) {
      errors.push(`Unknown Status: ${status} (cannot map to Lane)`);
      return null;
    }

    // Map Domain → Business
    const domain = plan.Domain;
    if (!domain) {
      errors.push("Missing Domain field");
      return null;
    }

    let business = DOMAIN_TO_BUSINESS[domain];
    if (!business) {
      // Try first token if compound domain
      const firstDomain = domain.split(/\s*[/,]\s*/)[0];
      business = DOMAIN_TO_BUSINESS[firstDomain];

      if (!business) {
        errors.push(`Unknown Domain: ${domain} (cannot map to Business)`);
        return null;
      }
    }

    // Derive Priority
    const priority = derivePriority(status);

    // Extract or generate Title
    let title = extractTitle(content);
    if (!title) {
      // Fallback to Feature-Slug humanized
      if (plan["Feature-Slug"]) {
        title = humanizeSlug(plan["Feature-Slug"]);
      } else {
        // Fallback to filename
        const filename = path.basename(planPath, ".md");
        title = humanizeSlug(filename.replace(/-plan$/, ""));
      }
    }

    // Generate ID
    const slug = plan["Feature-Slug"] || path.basename(planPath, ".md").replace(/-plan$/, "");
    const id = generateCardId(business, slug);

    // Get dates
    const created = plan.Created || plan["Last-reviewed"] || new Date().toISOString().split("T")[0];
    const updated = plan["Last-updated"] || plan["Last-reviewed"] || created;

    // Build card frontmatter
    const card: CardFrontmatter = {
      Type: "Card",
      Lane: lane,
      Priority: priority,
      Owner: "Pete",
      ID: id,
      Title: title,
      Business: business,
      Tags: ["plan-migration", domain.toLowerCase().replace(/\s+/g, "-")],
      Created: created,
      Updated: updated,
    };

    // Build card content (reference original plan + summary)
    const cardContent = `# ${title}

**Source:** Migrated from \`${path.relative(plansDir, planPath)}\`

${content.split("\n").slice(0, 20).join("\n")}

[... see full plan in ${path.relative(process.cwd(), planPath)}]
`;

    return { card, content: cardContent, errors: [] };
  } catch (error) {
    errors.push(`Parse error: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

// Main script
// eslint-disable-next-line complexity -- CLI script with many output branches
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const isCommit = args.includes("--commit");

  if (!isDryRun && !isCommit) {
    console.error("Usage: convert-plans-to-cards.ts [--dry-run | --commit]");
    console.error("  --dry-run: Preview what would be created");
    console.error("  --commit:  Actually create cards in D1");
    process.exit(1);
  }

  const plansDir = path.join(process.cwd(), "docs/plans");
  const planFiles = fs.readdirSync(plansDir).filter((f) => f.endsWith(".md"));

  console.log(`\n=== Plan → Card Migration ${isDryRun ? "(DRY RUN)" : "(COMMIT)"} ===\n`);
  console.log(`Found ${planFiles.length} plan files in ${plansDir}\n`);

  const results: {
    success: Array<{ file: string; card: CardFrontmatter }>;
    skipped: Array<{ file: string; reason: string }>;
    errors: Array<{ file: string; errors: string[] }>;
  } = {
    success: [],
    skipped: [],
    errors: [],
  };

  // Process each plan file
  for (const file of planFiles) {
    const planPath = path.join(plansDir, file);

    // Skip archive directory (handled separately if needed)
    if (file.includes("archive")) {
      results.skipped.push({ file, reason: "Archive directory (manual review)" });
      continue;
    }

    const result = convertPlanToCard(planPath, plansDir);

    if (!result) {
      results.skipped.push({ file, reason: "Not eligible for migration" });
      continue;
    }

    if (result.errors.length > 0) {
      results.errors.push({ file, errors: result.errors });
      continue;
    }

    results.success.push({ file, card: result.card });

    // In dry-run mode, just report what would be created
    if (isDryRun) {
      console.log(`✓ Would create card ${result.card.ID}:`);
      console.log(`  File:     ${file}`);
      console.log(`  Title:    ${result.card.Title}`);
      console.log(`  Lane:     ${result.card.Lane}`);
      console.log(`  Priority: ${result.card.Priority}`);
      console.log(`  Business: ${result.card.Business}`);
      console.log();
    } else {
      // Commit mode: write card file to docs/business-os/cards/
      const cardsDir = path.join(process.cwd(), "docs/business-os/cards");
      const cardPath = path.join(cardsDir, `${result.card.ID}.user.md`);

      const cardFileContent = matter.stringify(result.content, result.card);
      fs.writeFileSync(cardPath, cardFileContent);

      console.log(`✓ Created card ${result.card.ID}: ${result.card.Title}`);
    }
  }

  // Summary
  console.log("\n=== Migration Summary ===\n");
  console.log(`Success: ${results.success.length} cards ${isDryRun ? "would be created" : "created"}`);
  console.log(`Skipped: ${results.skipped.length} files`);
  console.log(`Errors:  ${results.errors.length} files`);
  console.log();

  // Business breakdown
  const businessCounts: Record<string, number> = {};
  for (const { card } of results.success) {
    businessCounts[card.Business!] = (businessCounts[card.Business!] || 0) + 1;
  }

  console.log("Cards by Business:");
  for (const [business, count] of Object.entries(businessCounts).sort()) {
    console.log(`  ${business}: ${count}`);
  }
  console.log();

  // Lane breakdown
  const laneCounts: Record<string, number> = {};
  for (const { card } of results.success) {
    laneCounts[card.Lane] = (laneCounts[card.Lane] || 0) + 1;
  }

  console.log("Cards by Lane:");
  for (const [lane, count] of Object.entries(laneCounts).sort()) {
    console.log(`  ${lane}: ${count}`);
  }
  console.log();

  if (results.skipped.length > 0) {
    console.log("Skipped files:");
    for (const { file, reason } of results.skipped) {
      console.log(`  - ${file}: ${reason}`);
    }
    console.log();
  }

  if (results.errors.length > 0) {
    console.log("Errors:");
    for (const { file, errors } of results.errors) {
      console.log(`  ${file}:`);
      for (const error of errors) {
        console.log(`    - ${error}`);
      }
    }
    console.log();
  }

  if (isDryRun) {
    console.log("This was a DRY RUN. No files were created.");
    console.log("Run with --commit to actually create cards.");
  } else {
    console.log(`Created ${results.success.length} card files in docs/business-os/cards/`);
    console.log("\nNext steps:");
    console.log("1. Review created cards in docs/business-os/cards/");
    console.log("2. Commit to git");
    console.log("3. Push to trigger D1 sync via hourly workflow");
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
