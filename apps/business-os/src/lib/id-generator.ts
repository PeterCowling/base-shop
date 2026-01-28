import fs from "node:fs/promises";
import path from "node:path";

/**
 * Generate a unique Business OS ID in format <BIZ>-OPP-####
 *
 * @param businessId - The business ID (e.g., "PLAT", "BRIK", "BOS")
 * @param repoRoot - Absolute path to repository root
 * @returns Promise<string> - Generated ID (e.g., "BRIK-OPP-0001")
 */
export async function generateBusinessOsId(
  businessId: string,
  repoRoot: string
): Promise<string> {
  const businessOsPath = path.join(repoRoot, "docs/business-os");

  // Find highest existing number for this business
  const highestNumber = await findHighestIdNumber(businessId, businessOsPath);

  // Generate next ID with zero-padded number
  const nextNumber = highestNumber + 1;
  const paddedNumber = String(nextNumber).padStart(4, "0");

  return `${businessId}-OPP-${paddedNumber}`;
}

/**
 * Find the highest ID number for a given business across all ideas and cards
 */
async function findHighestIdNumber(
  businessId: string,
  businessOsPath: string
): Promise<number> {
  let highest = 0;
  const pattern = new RegExp(`^${businessId}-OPP-(\\d+)$`);

  // Check ideas/inbox
  const inboxPath = path.join(businessOsPath, "ideas/inbox");
  highest = Math.max(highest, await scanDirectory(inboxPath, pattern));

  // Check ideas/worked
  const workedPath = path.join(businessOsPath, "ideas/worked");
  highest = Math.max(highest, await scanDirectory(workedPath, pattern));

  // Check cards
  const cardsPath = path.join(businessOsPath, "cards");
  highest = Math.max(highest, await scanDirectory(cardsPath, pattern));

  // Check archives
  const inboxArchivePath = path.join(businessOsPath, "ideas/inbox/archive");
  highest = Math.max(highest, await scanDirectory(inboxArchivePath, pattern));

  const workedArchivePath = path.join(businessOsPath, "ideas/worked/archive");
  highest = Math.max(highest, await scanDirectory(workedArchivePath, pattern));

  const cardsArchivePath = path.join(businessOsPath, "cards/archive");
  highest = Math.max(highest, await scanDirectory(cardsArchivePath, pattern));

  return highest;
}

/**
 * Scan a directory for files/subdirs matching the ID pattern
 */
async function scanDirectory(
  dirPath: string,
  pattern: RegExp
): Promise<number> {
  let highest = 0;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      // Skip .gitkeep and hidden files
      if (entry.name.startsWith(".")) continue;

      // For files: strip .user.md or .agent.md extension
      // For directories: use name as-is (card directories)
      const baseName = entry.isFile()
        ? entry.name.replace(/\.(user|agent)\.md$/, "")
        : entry.name;

      const match = pattern.exec(baseName);
      if (match) {
        const number = parseInt(match[1], 10);
        highest = Math.max(highest, number);
      }
    }
  } catch (err) {
    // Directory doesn't exist or can't be read - return 0
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn(`Warning: Could not scan directory ${dirPath}:`, err);
    }
  }

  return highest;
}

/**
 * Validate that a business ID exists in the business catalog
 */
export async function validateBusinessId(
  businessId: string,
  repoRoot: string
): Promise<boolean> {
  try {
    const catalogPath = path.join(
      repoRoot,
      "docs/business-os/strategy/businesses.json"
    );
    const catalogContent = await fs.readFile(catalogPath, "utf-8");
    const catalog = JSON.parse(catalogContent);

    return catalog.businesses.some(
      (business: { id: string }) => business.id === businessId
    );
  } catch (err) {
    console.error("Error validating business ID:", err);
    return false;
  }
}

/**
 * Get all valid business IDs from the catalog
 */
export async function getValidBusinessIds(
  repoRoot: string
): Promise<string[]> {
  try {
    const catalogPath = path.join(
      repoRoot,
      "docs/business-os/strategy/businesses.json"
    );
    const catalogContent = await fs.readFile(catalogPath, "utf-8");
    const catalog = JSON.parse(catalogContent);

    return catalog.businesses.map((business: { id: string }) => business.id);
  } catch (err) {
    console.error("Error reading business catalog:", err);
    return [];
  }
}
