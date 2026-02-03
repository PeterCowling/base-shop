#!/usr/bin/env tsx
/**
 * Translate Guides Script
 *
 * Translates 5 English guide files to 17 target languages (85 files total)
 * using the Claude API while preserving all special tokens.
 *
 * Usage: pnpm exec tsx scripts/translate-guides.ts
 *
 * Environment: Requires ANTHROPIC_API_KEY environment variable
 */

import fs from 'fs/promises';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

// Configuration
const GUIDES_TO_TRANSLATE = [
  'historyPositano.json',
  'ferragostoPositano.json',
  'folkloreAmalfi.json',
  'avoidCrowdsPositano.json',
  'positanoPompeii.json',
];

const TARGET_LOCALES = [
  'ar',  // Arabic
  'da',  // Danish
  'de',  // German
  'es',  // Spanish
  'fr',  // French
  'hi',  // Hindi
  'hu',  // Hungarian
  'it',  // Italian
  'ja',  // Japanese
  'ko',  // Korean
  'no',  // Norwegian
  'pl',  // Polish
  'pt',  // Portuguese
  'ru',  // Russian
  'sv',  // Swedish
  'vi',  // Vietnamese
  'zh',  // Chinese (Simplified)
];

const LOCALE_NAMES: Record<string, string> = {
  ar: 'Arabic',
  da: 'Danish',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  hi: 'Hindi',
  hu: 'Hungarian',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  no: 'Norwegian',
  pl: 'Polish',
  pt: 'Portuguese',
  ru: 'Russian',
  sv: 'Swedish',
  vi: 'Vietnamese',
  zh: 'Chinese (Simplified)',
};

const SOURCE_DIR = path.join(process.cwd(), 'src/locales/en/guides/content');
const TARGET_BASE_DIR = path.join(process.cwd(), 'src/locales');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Translation prompt for Claude
 */
function buildTranslationPrompt(
  sourceContent: string,
  targetLanguage: string,
  guideName: string
): string {
  return `You are a professional translator specializing in travel content for budget travelers.

TASK: Translate the following JSON guide content from English to ${LOCALE_NAMES[targetLanguage]}.

CRITICAL REQUIREMENTS:
1. Preserve ALL special tokens EXACTLY as they appear:
   - %LINK:guideKey|anchor text% - translate ONLY the anchor text, keep guideKey unchanged
   - %IMAGE:filename.jpg|alt text% - translate ONLY the alt text, keep filename unchanged
   - %COMPONENT:name% - keep completely unchanged

2. Preserve JSON structure exactly - only translate string values, never keys

3. Translate naturally for the target audience (hostel guests visiting Positano, Italy):
   - Use appropriate formality level for ${LOCALE_NAMES[targetLanguage]}
   - Maintain practical, direct, helpful tone
   - Keep content appropriate for budget travelers

4. Cultural adaptation:
   - Use natural expressions for the target language
   - Adapt measurements if culturally appropriate (but keep original in parentheses)
   - Keep proper nouns in original form (Positano, Chiesa Nuova, Via dei Mulini, etc.)

5. Return ONLY valid JSON - no explanations, no markdown code blocks

SOURCE CONTENT (${guideName}):
${sourceContent}

TRANSLATION (${LOCALE_NAMES[targetLanguage]}):`;
}

/**
 * Translate a single guide to a target language
 */
async function translateGuide(
  sourceContent: string,
  targetLocale: string,
  guideName: string
): Promise<string> {
  console.log(`  Translating to ${LOCALE_NAMES[targetLocale]}...`);

  try {
    const prompt = buildTranslationPrompt(sourceContent, targetLocale, guideName);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      temperature: 0.3, // Lower temperature for more consistent translations
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const translatedContent = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Validate JSON
    try {
      JSON.parse(translatedContent);
      console.log(`  ✓ ${LOCALE_NAMES[targetLocale]} translation validated`);
      return translatedContent;
    } catch (parseError) {
      console.error(`  ✗ Invalid JSON for ${LOCALE_NAMES[targetLocale]}`);
      throw new Error(`Invalid JSON output for ${targetLocale}: ${parseError}`);
    }
  } catch (error) {
    console.error(`  ✗ Translation failed for ${LOCALE_NAMES[targetLocale]}:`, error);
    throw error;
  }
}

/**
 * Process a single guide file for all target languages
 */
async function processGuide(guideName: string): Promise<void> {
  console.log(`\n📖 Processing guide: ${guideName}`);
  console.log(`━`.repeat(60));

  // Read source file
  const sourcePath = path.join(SOURCE_DIR, guideName);
  const sourceContent = await fs.readFile(sourcePath, 'utf-8');

  // Validate source is valid JSON
  try {
    JSON.parse(sourceContent);
  } catch (error) {
    console.error(`✗ Source file ${guideName} is not valid JSON`);
    throw error;
  }

  let successCount = 0;
  let failCount = 0;

  // Translate to each target language
  for (const locale of TARGET_LOCALES) {
    try {
      const translatedContent = await translateGuide(sourceContent, locale, guideName);

      // Write translated file
      const targetPath = path.join(TARGET_BASE_DIR, locale, 'guides/content', guideName);
      const targetDir = path.dirname(targetPath);

      // Ensure directory exists
      await fs.mkdir(targetDir, { recursive: true });

      // Write file with proper formatting
      const formattedContent = JSON.stringify(JSON.parse(translatedContent), null, 2);
      await fs.writeFile(targetPath, formattedContent + '\n', 'utf-8');

      successCount++;

      // Rate limiting - pause between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      failCount++;
      console.error(`Failed to translate ${guideName} to ${locale}:`, error);
      // Continue with next language even if one fails
    }
  }

  console.log(`\n✓ ${guideName}: ${successCount}/${TARGET_LOCALES.length} translations completed`);
  if (failCount > 0) {
    console.log(`⚠ ${failCount} translation(s) failed`);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('🌍 Guide Translation Script');
  console.log(`━`.repeat(60));
  console.log(`Translating ${GUIDES_TO_TRANSLATE.length} guides to ${TARGET_LOCALES.length} languages`);
  console.log(`Total files to generate: ${GUIDES_TO_TRANSLATE.length * TARGET_LOCALES.length}`);
  console.log(`━`.repeat(60));

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Error: ANTHROPIC_API_KEY environment variable is required');
    console.error('Set it with: export ANTHROPIC_API_KEY=your_api_key');
    process.exit(1);
  }

  // Check source directory exists
  try {
    await fs.access(SOURCE_DIR);
  } catch (error) {
    console.error(`❌ Error: Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const startTime = Date.now();
  let totalSuccess = 0;
  let totalFail = 0;

  // Process each guide
  for (const guideName of GUIDES_TO_TRANSLATE) {
    try {
      await processGuide(guideName);
      totalSuccess += TARGET_LOCALES.length;
    } catch (error) {
      console.error(`Failed to process ${guideName}:`, error);
      totalFail += TARGET_LOCALES.length;
    }
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Translation Summary');
  console.log(`${'='.repeat(60)}`);
  console.log(`✓ Successful translations: ${totalSuccess}`);
  console.log(`✗ Failed translations: ${totalFail}`);
  console.log(`⏱ Total time: ${duration} minutes`);
  console.log(`${'='.repeat(60)}\n`);

  if (totalFail > 0) {
    console.log('⚠ Some translations failed. Review errors above.');
    process.exit(1);
  }

  console.log('✨ All translations completed successfully!');
}

// Run script
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
