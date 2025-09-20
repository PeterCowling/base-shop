import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Ensures the rental pricing fixture is available under the temp repo.
 * Also creates the shop directory (`data/shops/<shopId>`) if missing.
 */
export async function setupRentalData(dir: string, shopId = 'bcd'): Promise<void> {
  const rentalDir = path.join(dir, 'data', 'rental');
  await fs.mkdir(rentalDir, { recursive: true });
  const shopDir = path.join(dir, 'data', 'shops', shopId);
  await fs.mkdir(shopDir, { recursive: true });

  // Copy pricing.json from the monorepo's data fixture folder
  const repoRoot = path.resolve(__dirname, '../../..');
  const sourcePricing = path.join(repoRoot, 'data', 'rental', 'pricing.json');
  await fs.copyFile(sourcePricing, path.join(rentalDir, 'pricing.json'));
}

