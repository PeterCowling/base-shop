import { mkdtempSync, cpSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Create a temporary DATA_ROOT and seed with __tests__/data/shops fixtures.
// Prints the path so shell can capture into DATA_ROOT env var.
function main() {
  const root = mkdtempSync(join(tmpdir(), 'cms-data-'));
  const dest = join(root, 'shops');
  mkdirSync(dest, { recursive: true });
  const src = join('__tests__', 'data', 'shops');
  cpSync(src, dest, { recursive: true });
  process.stdout.write(root);
}

try { main(); } catch (err) { console.error(err); process.exit(1); }

