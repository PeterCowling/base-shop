# Quick Start: Translate Guides

Run deterministic in-house guide translation workflows in 3 easy steps.

## 1. Install Dependencies

```bash
cd apps/brikette
pnpm install
```

This installs local tooling for fixture-based translation workflows.

## 2. Prepare Fixture File

Create a fixture JSON file with locale+guide entries:

```bash
cat > /tmp/guide-fixtures.json <<'JSON'
{
  "it:historyPositano.json": "{\"title\":\"...\"}",
  "fr:*": "{\"title\":\"...\"}"
}
JSON
```

## 3. Run Translation

```bash
pnpm exec tsx scripts/translate-guides.ts \
  --provider=fixture \
  --fixture-file=/tmp/guide-fixtures.json \
  --guides=historyPositano.json,ferragostoPositano.json,folkloreAmalfi.json,avoidCrowdsPositano.json,positanoPompeii.json \
  --locales=ar,da,de,es,fr,hi,hu,it,ja,ko,no,pl,pt,ru,sv,vi,zh \
  --write
```

That's it! The script will:
- Write fixture-generated translations for requested guides/locales
- Show progress for each translation
- Report success/failure summary

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
