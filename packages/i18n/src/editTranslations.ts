// Server-only helpers to add/update translation keys across locales.
// Intended to be called from CMS backend actions or scripts.

import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.join(__dirname);

function readJson(file: string): Record<string, string> {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- INTL-204: file path constrained to known locale JSONs within SRC_DIR
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string>;
}

function writeJson(file: string, obj: Record<string, string>) {
  const sorted = Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- INTL-204: file path constrained to known locale JSONs within SRC_DIR
  fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
}

export function addOrUpdateKey(key: string, enValue: string) {
  const locales = ['en', 'de', 'it'] as const;
  for (const loc of locales) {
    const file = path.join(SRC_DIR, `${loc}.json`);
    const obj = readJson(file);
    if (!(key in obj)) {
      obj[key] = enValue;
      writeJson(file, obj);
    }
  }
}

export function readLocalizedValues(key: string): Partial<Record<'en'|'de'|'it', string>> {
  const out: Partial<Record<'en'|'de'|'it', string>> = {};
  for (const loc of ['en', 'de', 'it'] as const) {
    const file = path.join(SRC_DIR, `${loc}.json`);
    const obj = readJson(file);
    if (obj[key] !== undefined) out[loc] = obj[key];
  }
  return out;
}
