import { execSync } from 'node:child_process';
import path from 'node:path';

import { NAMESPACE_GROUPS } from '../i18n.optimized';

// Extract all namespace strings from NAMESPACE_GROUPS
function getAllConfiguredNamespaces(): string[] {
  return Object.values(NAMESPACE_GROUPS).flat() as string[];
}

// Scan source files for useTranslation('Namespace') calls
function getUsedNamespaces(): string[] {
  const primeDir = path.resolve(__dirname, '..');
  const result = execSync(
    `grep -rn "useTranslation(" "${primeDir}" --include="*.tsx" --include="*.ts" ` +
      `| grep -v __tests__ | grep -v ".test." | grep -v ".spec." ` +
      `| grep -v node_modules`,
    { encoding: 'utf8' },
  );

  const namespaces = new Set<string>();
  for (const line of result.split('\n')) {
    // Match useTranslation('Namespace') — single namespace
    const single = line.match(/useTranslation\(['"](\w+)['"]\)/);
    if (single) {
      namespaces.add(single[1]);
    }
    // Match useTranslation(['Namespace1', 'Namespace2']) — array of namespaces
    const arrayMatch = line.match(/useTranslation\(\[([^\]]+)\]\)/);
    if (arrayMatch) {
      const items = arrayMatch[1].match(/['"](\w+)['"]/g);
      if (items) {
        for (const item of items) {
          namespaces.add(item.replace(/['"]/g, ''));
        }
      }
    }
  }
  return Array.from(namespaces).sort();
}

describe('Namespace manifest alignment', () => {
  const configured = getAllConfiguredNamespaces().sort();
  const used = getUsedNamespaces();

  test('every used namespace exists in NAMESPACE_GROUPS (TC-04)', () => {
    const missing = used.filter((ns) => !configured.includes(ns));
    expect(missing).toEqual([]);
  });

  test('every configured namespace has at least one consumer (TC-05)', () => {
    const unused = configured.filter((ns) => !used.includes(ns));
    expect(unused).toEqual([]);
  });
});
