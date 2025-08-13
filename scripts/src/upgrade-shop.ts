#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

/**
 * Resolve the component name from a given file by inspecting exported symbols.
 * Falls back to the file's base name when no explicit export is found.
 */
export function resolveComponentName(filePath: string): string {
  const content = readFileSync(filePath, 'utf8');
  const defaultFn = content.match(/export default function (\w+)/);
  if (defaultFn) return defaultFn[1];
  const defaultConst = content.match(/export default (\w+)/);
  if (defaultConst) return defaultConst[1];
  const namedConst = content.match(/export const (\w+)/);
  if (namedConst) return namedConst[1];
  const namedFn = content.match(/export function (\w+)/);
  if (namedFn) return namedFn[1];
  const base = filePath.split('/').pop() ?? filePath;
  return base.replace(/\.(tsx|ts|jsx|js)$/, '');
}

export interface UpgradeChange {
  file: string;
  componentName: string;
}

/**
 * Build change entries for the provided file paths.
 */
export function buildUpgradeChanges(files: string[], rootDir = resolve('.')): UpgradeChange[] {
  return files
    .filter((f) => f.includes('packages/ui/src/components'))
    .map((file) => {
      const abs = resolve(file);
      const componentName = resolveComponentName(abs);
      const relativePath = relative(rootDir, abs).replace(/\\/g, '/');
      return { file: relativePath, componentName };
    });
}

/**
 * CLI entry – write upgrade-changes.json with component name mapping.
 * Uses a simple filename check to detect direct execution without relying on
 * `import.meta`, keeping the module friendly for Jest/CommonJS.
 */
if (process.argv[1]?.endsWith('upgrade-shop.ts')) {
  const files = process.argv.slice(2);
  const changes = buildUpgradeChanges(files, resolve('.'));
  const outputPath = resolve('upgrade-changes.json');
  writeFileSync(outputPath, JSON.stringify(changes, null, 2));
}
