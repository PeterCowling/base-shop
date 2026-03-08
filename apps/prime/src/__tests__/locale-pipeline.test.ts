/**
 * Runtime locale asset pipeline validation tests (DS-10).
 *
 * Keeps runtime namespace coverage aligned with app configuration and verifies
 * the locale generation check script succeeds against the full locale tree.
 */
import * as fs from 'fs';
import * as path from 'path';

// Import NAMESPACE_GROUPS from i18n config to stay in sync (DS-05 alignment)
const { NAMESPACE_GROUPS } = require('../../src/i18n.optimized');

const LOCALES = ['en', 'it'];
const LOCALES_DIR = path.resolve(__dirname, '../../public/locales');

// Derive all namespaces from NAMESPACE_GROUPS
const ALL_NAMESPACES: string[] = Object.values(NAMESPACE_GROUPS).flat() as string[];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      keys.push(...flattenKeys(v as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// ---------------------------------------------------------------------------
// TC-22: Locale files exist for en/Homepage with expected keys
// ---------------------------------------------------------------------------
describe('locale pipeline', () => {
  test('TC-22: en/Homepage.json exists with expected keys', () => {
    const filePath = path.join(LOCALES_DIR, 'en', 'Homepage.json');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const keys = flattenKeys(content);
    expect(keys.length).toBeGreaterThan(0);
    // Homepage should have at least the 'welcome' and 'guest' related keys
    expect(keys).toEqual(expect.arrayContaining(['guest']));
  });

  // TC-23: Files exist for all locale × namespace combinations
  test('TC-23: locale files exist for all locale × namespace combinations', () => {
    const missing: string[] = [];

    for (const lng of LOCALES) {
      for (const ns of ALL_NAMESPACES) {
        const filePath = path.join(LOCALES_DIR, lng, `${ns}.json`);
        if (!fs.existsSync(filePath)) {
          missing.push(`${lng}/${ns}.json`);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  // TC-25: generate-locale-files --check validates the full locale tree
  test('TC-25: validation script succeeds for the full locale tree', () => {
    // This test verifies the --check mode of the generate script
    // by calling it as a child process. The script should exit 0 when
    // all files are present.
    const { execSync } = require('child_process');
    const scriptPath = path.resolve(__dirname, '../../scripts/generate-locale-files.cjs');

    // Should succeed when all files are present
    expect(() => {
      execSync(`node "${scriptPath}" --check`, { encoding: 'utf8' });
    }).not.toThrow();
  });
});
