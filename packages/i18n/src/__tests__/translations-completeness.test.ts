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
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test checks existence of a computed path for known files
      expect(fs.existsSync(filepath)).toBe(true);
    });

    test(`${file} matches ${baseFile}`, () => {
      const localeJson = JSON.parse(
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test reads a computed path within the repo under test
        fs.readFileSync(filepath, 'utf8'),
      ) as Record<string, unknown>;
      const localeKeys = Object.keys(localeJson).sort();
      const missing = baseKeys.filter((key) => !localeKeys.includes(key));
      const extra = localeKeys.filter((key) => !baseKeys.includes(key));
      expect({ missing, extra }).toEqual({ missing: [], extra: [] });
    });
  }
});
