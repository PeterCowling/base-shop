const fs = require('node:fs');
const path = require('node:path');

const SRC_DIR = path.join(__dirname, '..', 'packages', 'i18n', 'src');

const entries = [
  ['cms.media.errors.fileTooLarge', 'File too large'],
  ['cms.media.errors.orientation.landscape', 'Image orientation must be landscape'],
  ['cms.media.errors.orientation.portrait', 'Image orientation must be portrait'],
  ['cms.media.errors.processImageFailed', 'Failed to process image'],
  ['cms.media.errors.invalidFileType', 'Invalid file type'],
  ['cms.media.errors.invalidFilePath', 'Invalid file path'],
];

function readJson(file) {
  const raw = fs.readFileSync(file, 'utf8');
  // Remove // line comments and /* */ block comments for JSONC files
  const withoutLine = raw.replace(/^\s*\/\/.*$/gm, '');
  const withoutBlock = withoutLine.replace(/\/\*[\s\S]*?\*\//g, '');
  return JSON.parse(withoutBlock);
}

function writeJson(file, obj) {
  const sorted = Object.fromEntries(Object.entries(obj).sort(([a],[b]) => a.localeCompare(b)));
  fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
}

for (const loc of ['en', 'de', 'it']) {
  const file = path.join(SRC_DIR, `${loc}.json`);
  const obj = readJson(file);
  let changed = false;
  for (const [key, value] of entries) {
    if (!(key in obj)) {
      obj[key] = value;
      changed = true;
    }
  }
  if (changed) writeJson(file, obj);
}

console.log('Added/ensured keys:', entries.map(([k]) => k).join(', '));
