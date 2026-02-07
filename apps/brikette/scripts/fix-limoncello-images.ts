#!/usr/bin/env tsx

/**
 * Fix image tokens in limoncelloCuisine guide across all non-EN locales
 * Replaces old format (full paths, no alt) with new format (filename + alt text)
 */

import fs from 'fs';
import path from 'path';

const LOCALES_DIR = path.join(__dirname, '../src/locales');

const NON_EN_LOCALES = [
  'ar', 'da', 'de', 'es', 'fr', 'hi', 'hu', 'it', 'ja', 'ko',
  'no', 'pl', 'pt', 'ru', 'sv', 'vi', 'zh'
];

const IMAGE_REPLACEMENTS = [
  {
    old: '%IMAGE:public/img/guides/limoncello-and-local-cuisine/01-limoncello-tasting.jpg%',
    new: '%IMAGE:limoncello-tasting-shop.jpg|Local limoncello shop offering free tasting samples in Positano%'
  },
  {
    old: '%IMAGE:public/img/guides/limoncello-and-local-cuisine/02-limoncello-bottles.jpg%',
    new: '%IMAGE:limoncello-bottles-local.jpg|Authentic limoncello bottles from local Amalfi Coast producers%'
  },
  {
    old: '%IMAGE:public/img/guides/limoncello-and-local-cuisine/03-lemon-pasta.jpg%',
    new: '%IMAGE:spaghetti-al-limone.jpg|Fresh spaghetti al limone with Amalfi lemons at local restaurant%'
  },
  {
    old: '%IMAGE:public/img/guides/limoncello-and-local-cuisine/04-cooking-with-lemons.jpg%',
    new: '%IMAGE:amalfi-lemons-cooking.jpg|Fresh Amalfi Coast lemons (sfusato amalfitano) for cooking%'
  },
  {
    old: '%IMAGE:public/img/guides/limoncello-and-local-cuisine/05-local-restaurant.jpg%',
    new: '%IMAGE:local-italian-restaurant.jpg|Authentic local restaurant with handwritten Italian menu%'
  },
  {
    old: '%IMAGE:public/img/guides/limoncello-and-local-cuisine/06-market-lemons.jpg%',
    new: '%IMAGE:chiesa-nuova-market-lemons.jpg|Fresh Amalfi lemons at Chiesa Nuova Thursday market%'
  }
];

interface GuideSection {
  body?: string[];
  [key: string]: any;
}

interface GuideContent {
  sections?: GuideSection[];
  [key: string]: any;
}

function applyImageReplacements(content: string): string {
  let updated = content;
  for (const { old, new: newToken } of IMAGE_REPLACEMENTS) {
    updated = updated.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newToken);
  }
  return updated;
}

function processGuideFile(locale: string): { success: boolean; replacements: number; error?: string } {
  const filePath = path.join(LOCALES_DIR, locale, 'guides/content/limoncelloCuisine.json');

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return { success: false, replacements: 0, error: 'File not found' };
    }

    // Read and parse JSON
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const guide: GuideContent = JSON.parse(fileContent);

    let replacementCount = 0;

    // Process sections
    if (guide.sections && Array.isArray(guide.sections)) {
      guide.sections.forEach((section) => {
        if (section.body && Array.isArray(section.body)) {
          section.body = section.body.map((item) => {
            const updated = applyImageReplacements(item);
            if (updated !== item) {
              replacementCount++;
            }
            return updated;
          });
        }
      });
    }

    // Write back with proper formatting
    const updatedContent = JSON.stringify(guide, null, 2) + '\n';
    fs.writeFileSync(filePath, updatedContent, 'utf-8');

    // Validate by re-parsing
    JSON.parse(updatedContent);

    return { success: true, replacements: replacementCount };
  } catch (error) {
    return {
      success: false,
      replacements: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function main() {
  console.log('Fixing limoncelloCuisine image tokens across non-EN locales...\n');

  const results: Record<string, { success: boolean; replacements: number; error?: string }> = {};
  let totalReplacements = 0;
  let successCount = 0;
  let failCount = 0;

  for (const locale of NON_EN_LOCALES) {
    const result = processGuideFile(locale);
    results[locale] = result;

    if (result.success) {
      successCount++;
      totalReplacements += result.replacements;
      console.log(`✓ ${locale}: ${result.replacements} replacements`);
    } else {
      failCount++;
      console.log(`✗ ${locale}: ${result.error}`);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total locales processed: ${NON_EN_LOCALES.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Total image token replacements: ${totalReplacements}`);

  if (failCount > 0) {
    console.log('\n⚠ Some locales failed - review errors above');
    process.exit(1);
  } else {
    console.log('\n✓ All locales processed successfully!');
  }
}

main();
