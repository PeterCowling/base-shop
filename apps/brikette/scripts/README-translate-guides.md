# Guide Translation Script

Automated translation of travel guides to 17 languages using Claude API.

## Overview

This script translates 5 English guide files to 17 target languages (85 total files) while preserving special tokens and JSON structure.

**Files translated:**
- `historyPositano.json`
- `ferragostoPositano.json`
- `folkloreAmalfi.json`
- `avoidCrowdsPositano.json`
- `positanoPompeii.json`

**Target languages:** ar, da, de, es, fr, hi, hu, it, ja, ko, no, pl, pt, ru, sv, vi, zh

## Prerequisites

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up Anthropic API key:**
   ```bash
   export ANTHROPIC_API_KEY=your_api_key_here
   ```

   Get your API key from: https://console.anthropic.com/

## Usage

```bash
# From the brikette app directory
cd apps/brikette

# Run the translation script
pnpm run translate-guides
```

Or use tsx directly:
```bash
pnpm exec tsx scripts/translate-guides.ts
```

## What It Does

### 1. Reads Source Files
- Loads English guide content from `src/locales/en/guides/content/`
- Validates JSON structure

### 2. Translates Content
- Uses Claude Sonnet 4.5 for high-quality translations
- Preserves special tokens:
  - `%LINK:guideKey|anchor text%` → translates only anchor text
  - `%IMAGE:filename.jpg|alt text%` → translates only alt text
  - `%COMPONENT:name%` → keeps unchanged
- Maintains JSON structure (only translates string values)
- Uses appropriate tone for budget travel audience

### 3. Writes Output Files
- Creates files in `src/locales/{locale}/guides/content/`
- Formats JSON with 2-space indentation
- Validates output before writing

### 4. Reports Progress
- Shows real-time translation status
- Provides summary with success/failure counts
- Reports total execution time

## Output

The script generates 85 files:

```
src/locales/
├── ar/guides/content/
│   ├── historyPositano.json
│   ├── ferragostoPositano.json
│   ├── folkloreAmalfi.json
│   ├── avoidCrowdsPositano.json
│   └── positanoPompeii.json
├── da/guides/content/
│   └── ... (same 5 files)
├── de/guides/content/
│   └── ... (same 5 files)
...
└── zh/guides/content/
    └── ... (same 5 files)
```

## Rate Limiting

The script includes:
- 1-second pause between API requests
- Graceful error handling
- Continues on individual failures

**Estimated runtime:** 10-15 minutes for all 85 files

## Error Handling

### Common Issues

**1. Missing API Key**
```
❌ Error: ANTHROPIC_API_KEY environment variable is required
```
**Solution:** Set the environment variable with your API key

**2. Invalid JSON Output**
```
✗ Invalid JSON for Danish
```
**Solution:** The script will skip that file and continue. Review the error and re-run if needed.

**3. Rate Limit Hit**
```
Rate limit exceeded
```
**Solution:** Wait a moment and re-run. The script will pick up from where it left off.

### Recovery

If the script fails partway through:
1. It will report which translations succeeded
2. Re-running will overwrite existing files safely
3. Check the logs to see which files need manual attention

## Validation

The script validates:
- ✓ Source files are valid JSON
- ✓ Translated output is valid JSON
- ✓ Files are written successfully
- ✓ Directory structure is created

## Customization

### Add More Guides

Edit `GUIDES_TO_TRANSLATE` in `translate-guides.ts`:

```typescript
const GUIDES_TO_TRANSLATE = [
  'historyPositano.json',
  'ferragostoPositano.json',
  'folkloreAmalfi.json',
  'avoidCrowdsPositano.json',
  'positanoPompeii.json',
  'yourNewGuide.json', // Add here
];
```

### Add More Languages

Edit `TARGET_LOCALES` in `translate-guides.ts`:

```typescript
const TARGET_LOCALES = [
  'ar', 'da', 'de', // ... existing
  'fi', // Add Finnish, etc.
];
```

Also add to `LOCALE_NAMES` mapping.

### Adjust Translation Quality

Modify the Claude API parameters:

```typescript
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 16000,
  temperature: 0.3, // Lower = more consistent, Higher = more creative
  messages: [{ role: 'user', content: prompt }],
});
```

## Testing

After translation, validate the outputs:

```bash
# Check i18n coverage
pnpm run check-i18n-coverage

# Validate guide content
pnpm run validate-content

# Run content readiness tests
pnpm run test:content-readiness
```

## Manual Review

While the script produces high-quality translations, manual review is recommended for:
- Cultural nuances
- Local terminology preferences
- Brand voice consistency
- Complex technical terms

Focus review on:
1. FAQ sections (user-facing Q&A)
2. Tips sections (practical advice)
3. Intro paragraphs (first impression)

## Cost Estimate

Using Claude Sonnet 4.5:
- ~2,000 tokens input per guide
- ~2,500 tokens output per guide
- 85 translations total

**Estimated cost:** $3-5 USD for full translation batch

## Maintenance

### Update Translations

To re-translate specific guides:

1. Comment out guides you don't want to re-translate in `GUIDES_TO_TRANSLATE`
2. Run the script
3. Existing files will be overwritten

### Add New Sections

When source guides are updated:
1. Update the English source file
2. Re-run the script (it will overwrite all translations)
3. OR manually edit target files if changes are minor

## Troubleshooting

### TypeScript Errors

If you see TypeScript errors about the Anthropic SDK:

```bash
# Reinstall dependencies
pnpm install

# Clear cache
rm -rf node_modules/.cache
```

### Path Issues

The script uses absolute paths relative to `apps/brikette/`. Ensure you run it from:
- The brikette directory: `cd apps/brikette`
- Or use the pnpm script: `pnpm --filter @apps/brikette run translate-guides`

### Memory Issues

For very large batches, you might need:

```bash
NODE_OPTIONS="--max-old-space-size=4096" pnpm run translate-guides
```

## Support

For issues or questions:
1. Check this README first
2. Review error messages in console output
3. Validate source JSON files are correct
4. Check Anthropic API status: https://status.anthropic.com/

## Future Enhancements

Potential improvements:
- [ ] Parallel translation (batch API requests)
- [ ] Resume from checkpoint on failure
- [ ] Translation memory/cache for common phrases
- [ ] Automated quality checks (token preservation validation)
- [ ] Diff generation for updated translations
- [ ] Integration with CI/CD pipeline

---

**Last updated:** 2026-01-31
