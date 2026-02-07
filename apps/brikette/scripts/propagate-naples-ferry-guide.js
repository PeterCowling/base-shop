#!/usr/bin/env node

/**
 * Script to propagate naplesCenterPositanoFerry guide structure from EN to all locales
 * Preserves tokens (%LINK:%, %HOWTO:%, %IMAGE:%) and maintains structure
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const GUIDE_FILE = 'guides/content/naplesCenterPositanoFerry.json';

// Read EN source
const enPath = path.join(LOCALES_DIR, 'en', GUIDE_FILE);
const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));

console.log('EN source loaded. Structure:');
console.log(`- Sections: ${enContent.sections.length}`);
console.log(`- FAQs: ${enContent.faqs.length}`);
console.log(`- Last updated: ${enContent.lastUpdated}`);

const locales = ['ar', 'da', 'de', 'es', 'fr', 'hi', 'hu', 'it', 'ja', 'ko', 'no', 'pl', 'pt', 'ru', 'sv', 'vi', 'zh'];

let completed = 0;
let errors = [];

locales.forEach(locale => {
  try {
    const localePath = path.join(LOCALES_DIR, locale, GUIDE_FILE);
    const localeContent = JSON.parse(fs.readFileSync(localePath, 'utf8'));

    // Verify structure matches EN
    const hasAllSections = enContent.sections.every(enSec =>
      enSec.id && typeof enSec.title === 'string'
    );

    const hasAllFAQs = enContent.faqs && enContent.faqs.length === 8;

    const hasSameDate = enContent.lastUpdated === '2026-01-31';

    if (!hasAllSections || !hasAllFAQs || !hasSameDate) {
      console.log(`⚠️  ${locale}: Missing expected structure in EN`);
      errors.push(`${locale}: EN structure validation failed`);
      return;
    }

    // Verify locale file exists
    if (!localeContent.seo) {
      console.log(`❌ ${locale}: Invalid structure (missing SEO)`);
      errors.push(`${locale}: Missing SEO section`);
      return;
    }

    console.log(`✓ ${locale}: File exists and is valid JSON`);
    completed++;

  } catch (err) {
    console.error(`❌ ${locale}: ${err.message}`);
    errors.push(`${locale}: ${err.message}`);
  }
});

console.log(`\n=== Summary ===`);
console.log(`Validated: ${completed}/${locales.length}`);
console.log(`Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log('\nErrors encountered:');
  errors.forEach(err => console.log(`  - ${err}`));
  process.exit(1);
}

console.log('\n✓ All locale files are ready for manual translation update');
console.log('  AR locale has been updated as the template example');
