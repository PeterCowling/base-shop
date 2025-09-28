import { addOrUpdateKey } from '../packages/i18n/dist/editTranslations.js';

const entries = [
  ['cms.media.errors.fileTooLarge', 'File too large'],
  ['cms.media.errors.orientation.landscape', 'Image orientation must be landscape'],
  ['cms.media.errors.orientation.portrait', 'Image orientation must be portrait'],
  ['cms.media.errors.processImageFailed', 'Failed to process image'],
  ['cms.media.errors.invalidFileType', 'Invalid file type'],
  ['cms.media.errors.invalidFilePath', 'Invalid file path'],
];

for (const [key, value] of entries) {
  addOrUpdateKey(key, value);
}

console.log('Added/ensured keys:', entries.map(([k]) => k).join(', '));

