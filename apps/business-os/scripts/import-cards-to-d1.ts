#!/usr/bin/env tsx
/**
 * Import card files from docs/business-os/cards/ into D1 database
 *
 * Usage:
 *   pnpm tsx scripts/import-cards-to-d1.ts --dry-run  # Generate SQL and preview
 *   pnpm tsx scripts/import-cards-to-d1.ts --commit   # Actually insert into D1
 */

/* eslint-disable no-console, ds/no-hardcoded-copy */

import { execSync } from "child_process";
import fs from "fs";
import matter from "gray-matter";
import path from "path";

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
  [key: string]: unknown;
}

interface CardData {
  id: string;
  business: string;
  lane: string;
  priority: string;
  owner: string;
  title: string;
  frontmatter: CardFrontmatter;
  content: string;
}

// Parse card markdown file
function parseCardFile(cardPath: string): CardData | null {
  try {
    const fileContent = fs.readFileSync(cardPath, "utf-8");
    const { data: frontmatter, content } = matter(fileContent);
    const card = frontmatter as CardFrontmatter;

    // Validate card type
    if (card.Type !== "Card") {
      console.warn(`Skipping ${cardPath}: Not a Card document (Type: ${card.Type})`);
      return null;
    }

    // Validate required fields
    if (!card.ID || !card.Lane || !card.Priority || !card.Owner) {
      console.warn(`Skipping ${cardPath}: Missing required fields`);
      return null;
    }

    return {
      id: card.ID,
      business: card.Business || "PLAT",
      lane: card.Lane,
      priority: card.Priority,
      owner: card.Owner,
      title: card.Title || card.ID,
      frontmatter: card,
      content,
    };
  } catch (error) {
    console.error(`Error parsing ${cardPath}:`, error);
    return null;
  }
}

// Generate SQL INSERT statement
function generateInsertSql(card: CardData): string {
  // Create payload JSON (frontmatter + content)
  const payload = {
    ...card.frontmatter,
    content: card.content,
  };

  // Escape single quotes in JSON
  const payloadJson = JSON.stringify(payload).replace(/'/g, "''");

  // Use created/updated from frontmatter if available
  const createdAt = card.frontmatter.Created
    ? new Date(card.frontmatter.Created).toISOString()
    : new Date().toISOString();
  const updatedAt = card.frontmatter.Updated
    ? new Date(card.frontmatter.Updated).toISOString()
    : createdAt;

  return `INSERT INTO business_os_cards (id, business, lane, priority, owner, title, payload_json, created_at, updated_at)
VALUES ('${card.id}', '${card.business}', '${card.lane}', '${card.priority}', '${card.owner}', '${card.title.replace(/'/g, "''")}', '${payloadJson}', '${createdAt}', '${updatedAt}');`;
}

// Main script
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const isCommit = args.includes("--commit");

  if (!isDryRun && !isCommit) {
    console.error("Usage: import-cards-to-d1.ts [--dry-run | --commit]");
    console.error("  --dry-run: Generate SQL and preview (no D1 changes)");
    console.error("  --commit:  Actually insert into D1 database");
    process.exit(1);
  }

  const cardsDir = path.join(process.cwd(), "docs/business-os/cards");
  const cardFiles = fs.readdirSync(cardsDir).filter((f) => f.endsWith(".user.md"));

  console.log(`\n=== Card → D1 Import ${isDryRun ? "(DRY RUN)" : "(COMMIT)"} ===\n`);
  console.log(`Found ${cardFiles.length} card files in ${cardsDir}\n`);

  const cards: CardData[] = [];
  const skipped: string[] = [];

  // Parse all cards
  for (const file of cardFiles) {
    const cardPath = path.join(cardsDir, file);
    const card = parseCardFile(cardPath);

    if (card) {
      cards.push(card);
    } else {
      skipped.push(file);
    }
  }

  console.log(`Parsed ${cards.length} valid cards`);
  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} files\n`);
  }
  console.log();

  // Generate SQL
  const sqlStatements = cards.map(generateInsertSql);

  // Add audit log entries for migration
  const auditSql = cards.map(
    (card) => `INSERT INTO business_os_audit_log (entity_type, entity_id, action, actor, changes_json)
VALUES ('card', '${card.id}', 'create', 'system:migration', '${JSON.stringify({ source: "plan-migration" }).replace(/'/g, "''")}');`
  );

  const allSql = [...sqlStatements, ...auditSql].join("\n\n");

  if (isDryRun) {
    // Write SQL to file for inspection
    const sqlFile = path.join(process.cwd(), "tmp/cards-import.sql");
    fs.mkdirSync(path.dirname(sqlFile), { recursive: true });
    fs.writeFileSync(sqlFile, allSql);

    console.log(`Generated SQL written to: ${sqlFile}`);
    console.log(`\nPreview (first 10 cards):\n`);

    for (const card of cards.slice(0, 10)) {
      console.log(`  ${card.id}: ${card.title} [${card.lane}, ${card.priority}]`);
    }

    console.log(`\n... and ${Math.max(0, cards.length - 10)} more cards`);
    console.log("\nThis was a DRY RUN. No database changes made.");
    console.log("Run with --commit to execute SQL against D1.");
  } else {
    // Execute SQL against D1
    console.log("Executing SQL against D1 database...\n");

    const sqlFile = path.join(process.cwd(), "tmp/cards-import.sql");
    fs.mkdirSync(path.dirname(sqlFile), { recursive: true });
    fs.writeFileSync(sqlFile, allSql);

    try {
      // Use wrangler d1 execute with --file
      const dbName = "business-os";
      const command = `wrangler d1 execute ${dbName} --remote --file=${sqlFile}`;

      console.log(`Running: ${command}\n`);
      const output = execSync(command, { encoding: "utf-8", cwd: process.cwd() });
      console.log(output);

      console.log(`\n✓ Successfully imported ${cards.length} cards to D1`);
      console.log(`✓ Created ${cards.length} audit log entries\n`);

      // Business breakdown
      const businessCounts: Record<string, number> = {};
      for (const card of cards) {
        businessCounts[card.business] = (businessCounts[card.business] || 0) + 1;
      }

      console.log("Cards by Business:");
      for (const [business, count] of Object.entries(businessCounts).sort()) {
        console.log(`  ${business}: ${count}`);
      }
      console.log();

      // Lane breakdown
      const laneCounts: Record<string, number> = {};
      for (const card of cards) {
        laneCounts[card.lane] = (laneCounts[card.lane] || 0) + 1;
      }

      console.log("Cards by Lane:");
      for (const [lane, count] of Object.entries(laneCounts).sort()) {
        console.log(`  ${lane}: ${count}`);
      }
      console.log();

      console.log("Next steps:");
      console.log("1. Verify cards in UI: https://e4b2d615.business-os.pages.dev");
      console.log("2. Cards should auto-refresh within 30 seconds");
      console.log("3. Git export will run hourly to sync back to git");
    } catch (error) {
      console.error("\n❌ Error executing SQL:");
      console.error(error);
      console.log("\nSQL file saved to:", sqlFile);
      console.log("You can manually inspect and run with:");
      console.log(`  wrangler d1 execute business-os --remote --file=${sqlFile}`);
      process.exit(1);
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
