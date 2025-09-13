import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('seedShop', () => {
  it('copies template data into shop directory', async () => {
    process.env.BROWSERSLIST ??= 'defaults';
    const { seedShop } = await import('../../../scripts/src/seedShop');

    const root = mkdtempSync(join(tmpdir(), 'seed-shop-'));
    // Create template files
    const templateDir = join(root, 'data', 'templates', 'default');
    mkdirSync(templateDir, { recursive: true });
    const products = '[{"id":"p1"}]';
    const inventory = '[{"sku":"p1"}]';
    writeFileSync(join(templateDir, 'products.json'), products);
    writeFileSync(join(templateDir, 'inventory.json'), inventory);
    // Prepare destination
    const shopDir = join(root, 'data', 'shops', 'demo');
    mkdirSync(shopDir, { recursive: true });
    // Run seed
    const cwd = process.cwd();
    process.chdir(root);
    try {
      seedShop('demo');
    } finally {
      process.chdir(cwd);
    }
    const copiedProducts = readFileSync(join(shopDir, 'products.json'), 'utf8');
    const copiedInventory = readFileSync(join(shopDir, 'inventory.json'), 'utf8');
    expect(copiedProducts).toBe(products);
    expect(copiedInventory).toBe(inventory);
    rmSync(root, { recursive: true, force: true });
  });
});
