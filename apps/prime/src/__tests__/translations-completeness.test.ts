/**
 * translations-completeness.test.ts
 *
 * Regression guard for Prime locale parity between EN and IT.
 *
 * For each of the 11 namespaces this test asserts:
 *   1. Every leaf key present in the EN file also exists in the IT file.
 *   2. No IT value contains the stub marker "[IT]".
 *
 * Test IDs: TC-TRANS-01 (key parity) and TC-TRANS-02 (no stubs).
 */

import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns all dot-separated leaf key paths in a (possibly nested) object.
 * Arrays are treated as objects keyed by their numeric indices.
 *
 * Example: { a: { b: "x" } } → ["a.b"]
 */
function getLeafKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') {
    return [prefix];
  }
  const keys = Object.keys(obj as Record<string, unknown>);
  if (keys.length === 0) {
    // An empty object has no leaf keys.
    return [];
  }
  const result: string[] = [];
  for (const key of keys) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const children = getLeafKeys((obj as Record<string, unknown>)[key], fullKey);
    result.push(...children);
  }
  return result;
}

/**
 * Returns all dot-separated leaf key paths whose corresponding value (as a
 * string) contains the substring `[IT]`.
 */
function getStubKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') {
    const value = String(obj ?? '');
    return value.includes('[IT]') ? [prefix] : [];
  }
  const keys = Object.keys(obj as Record<string, unknown>);
  const result: string[] = [];
  for (const key of keys) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const children = getStubKeys((obj as Record<string, unknown>)[key], fullKey);
    result.push(...children);
  }
  return result;
}

/**
 * Reads and parses a locale JSON file. Returns an empty object if the file
 * does not exist or is empty.
 */
function readLocale(locale: string, namespace: string): Record<string, unknown> {
  const filePath = path.resolve(
    process.cwd(),
    'public/locales',
    locale,
    `${namespace}.json`,
  );
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) {
    return {};
  }
  return JSON.parse(raw) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Namespaces under test
// ---------------------------------------------------------------------------

const NAMESPACES = [
  'Activities',
  'BookingDetails',
  'Chat',
  'FindMyStay',
  'Homepage',
  'Onboarding',
  'PositanoGuide',
  'PreArrival',
  'Quests',
  'Settings',
  'rooms',
] as const;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

for (const namespace of NAMESPACES) {
  describe(`Namespace: ${namespace}`, () => {
    const en = readLocale('en', namespace);
    const it = readLocale('it', namespace);

    const enKeys = getLeafKeys(en);
    const itKeys = new Set(getLeafKeys(it));

    it(`IT locale has all EN keys for namespace ${namespace} (TC-TRANS-01)`, () => {
      const missingKeys = enKeys.filter((key) => !itKeys.has(key));
      expect(missingKeys).toEqual([]);
    });

    it(`IT locale has no [IT] stub values for namespace ${namespace} (TC-TRANS-02)`, () => {
      const stubKeys = getStubKeys(it);
      expect(stubKeys).toEqual([]);
    });
  });
}
