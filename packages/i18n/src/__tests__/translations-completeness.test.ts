import fs from 'node:fs';
import path from 'node:path';

describe('translations completeness', () => {
  const dir = path.join(__dirname, '..');
  const baseFile = 'en.json';
  const base = JSON.parse(fs.readFileSync(path.join(dir, baseFile), 'utf8')) as Record<string, unknown>;
  const baseKeys = Object.keys(base).sort();

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== baseFile);

  for (const file of files) {
    test(`${file} matches ${baseFile}`, () => {
      const locale = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')) as Record<string, unknown>;
      const localeKeys = Object.keys(locale).sort();
      const missing = baseKeys.filter((key) => !localeKeys.includes(key));
      const extra = localeKeys.filter((key) => !baseKeys.includes(key));
      expect({ missing, extra }).toEqual({ missing: [], extra: [] });
    });
  }
});
