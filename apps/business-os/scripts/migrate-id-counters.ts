/**
 * Migration script: Seed ID counters from existing IDs
 * MVP-C2: One-time migration to initialize counters.json
 *
 * Scans all existing cards and ideas, finds highest ID per business/type,
 * and initializes counters.json with those values.
 *
 * Usage:
 *   pnpm tsx apps/business-os/scripts/migrate-id-counters.ts
 */

import fs from "node:fs/promises";
import path from "node:path";

import { getRepoRoot } from "../src/lib/get-repo-root";

interface Counters {
  [business: string]: {
    [type: string]: number;
  };
}

/**
 * Scan directory for files/subdirs matching ID pattern
 * Returns highest number found
 */
async function scanDirectory(
  dirPath: string,
  prefix: string
): Promise<number> {
  let highest = 0;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      let idMatch: RegExpMatchArray | null = null;

      if (entry.isDirectory()) {
        // Card directories: BRIK-003/
        idMatch = entry.name.match(/^([A-Z]+)-(\d+)$/);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        // Idea files: BRIK-OPP-0003.md
        idMatch = entry.name.match(/^([A-Z]+-OPP-\d+)\.md$/);
        if (idMatch) {
          // Extract just the number
          const numberMatch = idMatch[1].match(/-(\d+)$/);
          if (numberMatch) {
            const num = parseInt(numberMatch[1], 10);
            if (!isNaN(num)) {
              highest = Math.max(highest, num);
            }
          }
          continue;
        }

        // Card files: BRIK-003.md (legacy format)
        idMatch = entry.name.match(/^([A-Z]+)-(\d+)\.md$/);
      }

      if (idMatch && idMatch[2]) {
        const num = parseInt(idMatch[2], 10);
        if (!isNaN(num)) {
          highest = Math.max(highest, num);
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist or not accessible
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn(`Warning: Could not scan ${dirPath}:`, error);
    }
  }

  return highest;
}

/**
 * Find highest ID number for a business across all locations
 */
async function findHighestIdNumber(
  businessId: string,
  businessOsPath: string
): Promise<{ card: number; idea: number }> {
  let highestCard = 0;
  let highestIdea = 0;

  const cardPrefix = `${businessId}-`;
  const ideaPrefix = `${businessId}-OPP-`;

  // Scan all possible locations
  const locations = [
    { path: "ideas/inbox", type: "idea" as const },
    { path: "ideas/worked", type: "idea" as const },
    { path: "ideas/inbox/archive", type: "idea" as const },
    { path: "ideas/worked/archive", type: "idea" as const },
    { path: "cards", type: "card" as const },
    { path: "cards/archive", type: "card" as const },
  ];

  for (const location of locations) {
    const dirPath = path.join(businessOsPath, location.path);
    const prefix = location.type === "idea" ? ideaPrefix : cardPrefix;
    const highest = await scanDirectory(dirPath, prefix);

    if (location.type === "idea") {
      highestIdea = Math.max(highestIdea, highest);
    } else {
      highestCard = Math.max(highestCard, highest);
    }
  }

  return { card: highestCard, idea: highestIdea };
}

/**
 * Discover all businesses by scanning directory structure
 */
async function discoverBusinesses(businessOsPath: string): Promise<string[]> {
  const businesses = new Set<string>();

  const locations = [
    "ideas/inbox",
    "ideas/worked",
    "cards",
    "ideas/inbox/archive",
    "ideas/worked/archive",
    "cards/archive",
  ];

  for (const location of locations) {
    const dirPath = path.join(businessOsPath, location);

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        // Extract business ID from file/directory name
        const match = entry.name.match(/^([A-Z]+)-(OPP-)?\d+/);
        if (match && match[1]) {
          businesses.add(match[1]);
        }
      }
    } catch (error) {
      // Directory doesn't exist - skip
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.warn(`Warning: Could not scan ${dirPath}:`, error);
      }
    }
  }

  return Array.from(businesses).sort();
}

/**
 * Main migration function
 */
async function migrate() {
  console.log("Starting ID counter migration...\n");

  const repoRoot = getRepoRoot();
  const businessOsPath = path.join(repoRoot, "docs/business-os");
  const countersFile = path.join(businessOsPath, "_meta/counters.json");

  // Check if counters file already exists
  try {
    await fs.access(countersFile);
    console.log(
      "⚠️  Counters file already exists at:",
      countersFile
    );
    console.log(
      "To re-run migration, delete the file first or use --force flag.\n"
    );
    process.exit(1);
  } catch (error) {
    // File doesn't exist - good, we can proceed
  }

  // Discover businesses
  console.log("Discovering businesses...");
  const businesses = await discoverBusinesses(businessOsPath);
  console.log(`Found ${businesses.length} business(es): ${businesses.join(", ")}\n`);

  // Scan each business
  const counters: Counters = {};

  for (const business of businesses) {
    console.log(`Scanning ${business}...`);
    const { card, idea } = await findHighestIdNumber(business, businessOsPath);

    if (card > 0 || idea > 0) {
      counters[business] = {};

      if (card > 0) {
        counters[business].card = card;
        console.log(`  - Cards: ${card} (next will be ${business}-${String(card + 1).padStart(3, "0")})`);
      }

      if (idea > 0) {
        counters[business].idea = idea;
        console.log(
          `  - Ideas: ${idea} (next will be ${business}-OPP-${String(idea + 1).padStart(3, "0")})`
        );
      }
    } else {
      console.log(`  - No existing IDs found`);
    }
  }

  // Write counters file
  console.log(`\nWriting counters to ${countersFile}...`);

  // Ensure directory exists
  const metaDir = path.join(businessOsPath, "_meta");
  await fs.mkdir(metaDir, { recursive: true });

  // Write file
  await fs.writeFile(countersFile, JSON.stringify(counters, null, 2));

  console.log("✅ Migration complete!\n");
  console.log("Summary:");
  console.log(`  - Businesses migrated: ${businesses.length}`);
  console.log(
    `  - Total counters initialized: ${Object.values(counters).reduce((sum, b) => sum + Object.keys(b).length, 0)}`
  );
  console.log(`  - Counters file: ${countersFile}\n`);
}

// Run migration
migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
