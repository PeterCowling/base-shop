# Quick Start: Translate Guides

Generate all 85 translated guide files in 3 easy steps.

## 1. Install Dependencies

```bash
cd apps/brikette
pnpm install
```

This installs the `@anthropic-ai/sdk` package needed for translations.

## 2. Set API Key

Get your Anthropic API key from https://console.anthropic.com/

```bash
export ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Tip:** Add to your `.env.local` or shell profile for persistence:
```bash
echo 'export ANTHROPIC_API_KEY=sk-ant-api03-...' >> ~/.zshrc
```

## 3. Run Translation

```bash
pnpm run translate-guides
```

That's it! The script will:
- Translate 5 guides to 17 languages (85 files total)
- Show progress for each translation
- Report success/failure summary
- Take approximately 10-15 minutes

## Output

Files are written to:
```
src/locales/{locale}/guides/content/
  ├── historyPositano.json
  ├── ferragostoPositano.json
  ├── folkloreAmalfi.json
  ├── avoidCrowdsPositano.json
  └── positanoPompeii.json
```

For 17 locales: ar, da, de, es, fr, hi, hu, it, ja, ko, no, pl, pt, ru, sv, vi, zh

## Verify

After completion, validate the translations:

```bash
# Check i18n coverage
pnpm run check-i18n-coverage

# Validate content structure
pnpm run validate-content
```

## Troubleshooting

**API Key Error?**
```bash
echo $ANTHROPIC_API_KEY  # Should print your key
```

**Permission Error?**
```bash
chmod +x scripts/translate-guides.ts
```

**TypeScript Error?**
```bash
pnpm install  # Reinstall dependencies
```

## Need Help?

See the full documentation: `scripts/README-translate-guides.md`

---

**Estimated cost:** $3-5 USD for complete translation batch
**Estimated time:** 10-15 minutes
