import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Ensures the rental pricing fixture is available under the temp repo.
 * Also creates the shop directory (`data/shops/<shopId>`) if missing.
 */
export async function setupRentalData(dir: string, shopId = 'bcd'): Promise<void> {
  const rentalDir = path.join(dir, 'data', 'rental');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- TEST-1234 temp fixture directory
  await fs.mkdir(rentalDir, { recursive: true });
  const shopDir = path.join(dir, 'data', 'shops', shopId);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- TEST-1234 temp fixture directory
  await fs.mkdir(shopDir, { recursive: true });

  // Copy pricing.json from the monorepo's data fixture folder
  const repoRoot = path.resolve(__dirname, '../../..');
  const sourcePricing = path.join(repoRoot, 'data', 'rental', 'pricing.json');
  await fs.copyFile(sourcePricing, path.join(rentalDir, 'pricing.json'));
}
