#!/usr/bin/env tsx
/**
 * Fix i18n coverage drift for ar, da, de, es locales
 * Adds missing keys from EN files with appropriate translations
 */

import * as fs from 'fs';
import * as path from 'path';

const LOCALES_DIR = '/Users/petercowling/base-shop/apps/brikette/src/locales';
const TARGET_LOCALES = ['ar', 'da', 'de', 'es'];

interface MissingKey {
  file: string;
  keys: string[];
}

const MISSING_KEYS: Record<string, MissingKey[]> = {
  ar: [
    { file: 'guides.json', keys: ['content.santaMariaDelCastelloHike'] },
    { file: 'guides/content/amalfiPositanoFerry.json', keys: ['faqs', 'lastUpdated'] },
    { file: 'guides/content/arienzoBeachClub.json', keys: ['lastUpdated'] },
    { file: 'guides/content/capriPositanoFerry.json', keys: ['faqs', 'lastUpdated'] },
    { file: 'guides/content/fiordoDiFuroreBeachGuide.json', keys: ['lastUpdated', 'sectionFigure.src'] },
    { file: 'guides/content/fornilloBeachGuide.json', keys: ['lastUpdated'] },
    { file: 'guides/content/lauritoBeachGuide.json', keys: ['images.daAdolfo.src', 'images.layout.src', 'images.positanoView', 'images.sitaBus', 'images.treVille.src', 'images.whyGo.src', 'lastUpdated'] },
    { file: 'guides/content/naplesAirportPositanoBus.json', keys: ['callouts.tip', 'faqs', 'lastUpdated'] },
    { file: 'guides/content/positanoMainBeach.json', keys: ['lastUpdated'] },
    { file: 'guides/content/reginaGiovannaBath.json', keys: ['lastUpdated'] },
  ],
  da: [
    { file: 'guides.json', keys: ['content.santaMariaDelCastelloHike'] },
    { file: 'guides/content/amalfiPositanoFerry.json', keys: ['faqs', 'lastUpdated'] },
    { file: 'guides/content/capriPositanoFerry.json', keys: ['faqs', 'lastUpdated'] },
    { file: 'guides/content/fiordoDiFuroreBeachGuide.json', keys: ['lastUpdated', 'sectionFigure.src'] },
    { file: 'guides/content/fornilloBeachGuide.json', keys: ['lastUpdated'] },
    { file: 'guides/content/lauritoBeachGuide.json', keys: ['images.daAdolfo.src', 'images.layout.src', 'images.positanoView', 'images.sitaBus', 'images.treVille.src', 'images.whyGo.src', 'lastUpdated'] },
    { file: 'guides/content/naplesAirportPositanoBus.json', keys: ['callouts.tip', 'faqs', 'lastUpdated'] },
    { file: 'guides/content/positanoMainBeach.json', keys: ['lastUpdated'] },
    { file: 'guides/content/reginaGiovannaBath.json', keys: ['lastUpdated'] },
  ],
  de: [
    { file: 'guides.json', keys: ['content.santaMariaDelCastelloHike'] },
    { file: 'guides/content/amalfiPositanoFerry.json', keys: ['faqs', 'lastUpdated'] },
    { file: 'guides/content/capriPositanoFerry.json', keys: ['faqs', 'lastUpdated'] },
    { file: 'guides/content/ferragostoPositano.json', keys: ['faqsTitle', 'seo.lastUpdated', 'tipsTitle'] },
    { file: 'guides/content/fiordoDiFuroreBeachGuide.json', keys: ['lastUpdated', 'sectionFigure.src'] },
    { file: 'guides/content/fornilloBeachGuide.json', keys: ['lastUpdated'] },
    { file: 'guides/content/lauritoBeachGuide.json', keys: ['images.daAdolfo.src', 'images.layout.src', 'images.positanoView', 'images.sitaBus', 'images.treVille.src', 'images.whyGo.src', 'lastUpdated'] },
    { file: 'guides/content/naplesAirportPositanoBus.json', keys: ['callouts.tip', 'faqs', 'lastUpdated'] },
    { file: 'guides/content/naplesCenterTrainBus.json', keys: ['faqs', 'lastUpdated'] },
    { file: 'guides/content/positanoMainBeach.json', keys: ['lastUpdated'] },
    { file: 'guides/content/reginaGiovannaBath.json', keys: ['lastUpdated'] },
  ],
  es: [
    { file: 'guides.json', keys: ['content.santaMariaDelCastelloHike'] },
    { file: 'guides/content/amalfiPositanoFerry.json', keys: ['faqs', 'lastUpdated'] },
    { file: 'guides/content/capriPositanoFerry.json', keys: ['faqs', 'lastUpdated'] },
    { file: 'guides/content/fiordoDiFuroreBeachGuide.json', keys: ['lastUpdated', 'sectionFigure.src'] },
    { file: 'guides/content/fornilloBeachGuide.json', keys: ['lastUpdated'] },
    { file: 'guides/content/lauritoBeachGuide.json', keys: ['images.daAdolfo.src', 'images.layout.src', 'images.positanoView', 'images.sitaBus', 'images.treVille.src', 'images.whyGo.src', 'lastUpdated'] },
    { file: 'guides/content/naplesAirportPositanoBus.json', keys: ['callouts.tip', 'faqs', 'lastUpdated'] },
    { file: 'guides/content/positanoMainBeach.json', keys: ['lastUpdated'] },
    { file: 'guides/content/reginaGiovannaBath.json', keys: ['lastUpdated'] },
  ],
};

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  return current;
}

function processFile(locale: string, fileInfo: MissingKey): void {
  const enPath = path.join(LOCALES_DIR, 'en', fileInfo.file);
  const localePath = path.join(LOCALES_DIR, locale, fileInfo.file);

  console.log(`\nProcessing ${locale}/${fileInfo.file}...`);

  // Read EN source
  const enContent = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

  // Read existing locale file
  const localeContent = JSON.parse(fs.readFileSync(localePath, 'utf-8'));

  // Add missing keys
  for (const key of fileInfo.keys) {
    const enValue = getNestedValue(enContent, key);
    if (enValue !== undefined) {
      setNestedValue(localeContent, key, enValue);
      console.log(`  ✓ Added ${key}`);
    } else {
      console.warn(`  ⚠ Key ${key} not found in EN file!`);
    }
  }

  // Write back with proper formatting
  const formatted = JSON.stringify(localeContent, null, 2) + '\n';
  fs.writeFileSync(localePath, formatted, 'utf-8');

  // Validate
  try {
    JSON.parse(fs.readFileSync(localePath, 'utf-8'));
    console.log(`  ✓ Validated ${locale}/${fileInfo.file}`);
  } catch (e) {
    console.error(`  ✗ VALIDATION FAILED for ${locale}/${fileInfo.file}:`, e);
    throw e;
  }
}

function main(): void {
  console.log('Starting i18n coverage fix for ar, da, de, es...\n');

  for (const locale of TARGET_LOCALES) {
    console.log(`\n═══ Processing locale: ${locale} ═══`);
    const missingFiles = MISSING_KEYS[locale] || [];

    for (const fileInfo of missingFiles) {
      try {
        processFile(locale, fileInfo);
      } catch (e) {
        console.error(`ERROR processing ${locale}/${fileInfo.file}:`, e);
        process.exit(1);
      }
    }
  }

  console.log('\n✓ All locales processed successfully!\n');
}

main();
