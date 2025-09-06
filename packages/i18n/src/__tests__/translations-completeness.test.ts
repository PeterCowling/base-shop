import fs from 'node:fs';
import path from 'node:path';

import { LOCALES } from '../locales';

describe('translations completeness', () => {
  const dir = path.join(__dirname, '..');
  const baseLocale = 'en';
  const baseFile = `${baseLocale}.json`;
  const base = JSON.parse(
    fs.readFileSync(path.join(dir, baseFile), 'utf8'),
  ) as Record<string, unknown>;
  const baseKeys = Object.keys(base).sort();

  for (const locale of LOCALES) {
    const file = `${locale}.json`;
    const filepath = path.join(dir, file);

    test(`${file} exists`, () => {
      expect(fs.existsSync(filepath)).toBe(true);
    });

    test(`${file} matches ${baseFile}`, () => {
      const localeJson = JSON.parse(
        fs.readFileSync(filepath, 'utf8'),
      ) as Record<string, unknown>;
      const localeKeys = Object.keys(localeJson).sort();
      const missing = baseKeys.filter((key) => !localeKeys.includes(key));
      const extra = localeKeys.filter((key) => !baseKeys.includes(key));
      expect({ missing, extra }).toEqual({ missing: [], extra: [] });
    });
  }
});
