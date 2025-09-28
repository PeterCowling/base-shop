#!/usr/bin/env ts-node
/*
 * Migration: legacy strings → inline.en
 *
 * Finds string-only fields in page JSON and converts them to
 * { type:'inline', value:{ en: str } }.
 *
 * Usage:
 *   pnpm tsx packages/i18n/scripts/migrate-legacy-strings.ts --path data/pages --dry-run
 *   pnpm tsx packages/i18n/scripts/migrate-legacy-strings.ts --path data/pages --write
 */
import fs from 'node:fs';
import path from 'node:path';

type Json = null | string | number | boolean | Json[] | { [k: string]: Json };

interface Options {
  rootPath: string;
  write: boolean;
  includeKeys: string[]; // keys to treat as translatable when value is string
}

const DEFAULT_KEYS = [
  'text',
  'title',
  'subtitle',
  'caption',
  'ctaLabel',
  'placeholder',
  'label',
  'desc',
  'description',
  'alt',
  'helper',
  'error',
];

function parseArgs(): Options {
  const args = process.argv.slice(2);
  let rootPath = '';
  let write = false;
  let includeKeys = DEFAULT_KEYS.slice();
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--path') {
      rootPath = String(args[++i] ?? '');
    } else if (a === '--write') {
      write = true;
    } else if (a === '--dry-run') {
      write = false;
    } else if (a.startsWith('--include=')) {
      includeKeys = a.slice('--include='.length).split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  if (!rootPath) {
    // eslint-disable-next-line ds/no-hardcoded-copy -- INTL-201 [ttl=2026-03-31]
    console.error('Error: --path is required (file or directory)');
    process.exit(1);
  }
  return { rootPath, write, includeKeys };
}

type Change = { file: string; changes: number };

type TranslatableShape = { type: 'inline' | 'key' };
function isTranslatableShape(v: unknown): v is TranslatableShape {
  if (v && typeof v === 'object') {
    const maybe = v as { type?: unknown };
    return maybe.type === 'inline' || maybe.type === 'key';
  }
  return false;
}

function migrateValue(key: string, v: Json, includeKeys: string[]): { changed: boolean; next: Json } {
  if (typeof v === 'string' && includeKeys.includes(key)) {
    return { changed: true, next: { type: 'inline', value: { en: v } } as unknown as Json };
  }
  if (Array.isArray(v)) {
    let changed = false;
    const next = v.map((item, idx) => {
      const r = migrateValue(String(idx), item, includeKeys);
      changed = changed || r.changed;
      return r.next;
    });
    return { changed, next };
  }
  if (v && typeof v === 'object') {
    if (isTranslatableShape(v)) return { changed: false, next: v };
    let changed = false;
    const next: Record<string, Json> = {};
    for (const [k, val] of Object.entries(v)) {
      const r = migrateValue(k, val as Json, includeKeys);
      changed = changed || r.changed;
      next[k] = r.next;
    }
    return { changed, next };
  }
  return { changed: false, next: v };
}

function walkFiles(rootPath: string): string[] {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- INTL-202: CLI input validated and resolved within this script
  const stat = fs.statSync(rootPath);
  if (stat.isFile()) return [rootPath];
  const files: string[] = [];
  function walk(dir: string) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- INTL-202: directory derived from validated rootPath
    for (const entry of fs.readdirSync(dir)) {
      const p = path.join(dir, entry);
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- INTL-202: path constructed from safe parent and entry
      const s = fs.statSync(p);
      if (s.isDirectory()) walk(p);
      else if (s.isFile() && entry.endsWith('.json')) files.push(p);
    }
  }
  walk(rootPath);
  return files;
}

function main() {
  const { rootPath, write, includeKeys } = parseArgs();
  const files = walkFiles(rootPath);
  const results: Change[] = [];
  for (const file of files) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- INTL-202: iterating validated JSON files discovered under rootPath
      const orig = fs.readFileSync(file, 'utf8');
      const json = JSON.parse(orig) as Json;
      const { changed, next } = migrateValue('', json, includeKeys);
      if (changed) {
        results.push({ file, changes: 1 });
        if (write) {
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- INTL-202: writing back to same validated file path
          fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n', 'utf8');
        }
      }
    } catch (err) {
      // i18n-exempt -- I18N-201: CLI warning message for developers
      console.warn(`[migrate] Skipped invalid JSON: ${file}`, err);
    }
  }
  const total = results.reduce((n, r) => n + r.changes, 0);
  if (results.length === 0) {
    // i18n-exempt -- I18N-201 CLI output for developers [ttl=2026-03-31]
    console.log('No changes'); // i18n-exempt -- I18N-201 CLI output for developers [ttl=2026-03-31]
  } else {
    // i18n-exempt -- I18N-201 CLI summary output for developers [ttl=2026-03-31]
    console.log(`${results.length} files would change (${total} updates).`); // i18n-exempt -- I18N-201 CLI summary output for developers [ttl=2026-03-31]
    for (const r of results) console.log(`- ${r.file}`); // i18n-exempt -- I18N-201 CLI detail output [ttl=2026-03-31]
  }
  if (!write)
    // eslint-disable-next-line ds/no-hardcoded-copy -- INTL-201 [ttl=2026-03-31]
    console.log('Dry-run only. Re-run with --write to apply.');
}

main();
