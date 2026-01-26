# Guide Translation Workflow

This guide explains how to identify and fix missing translations in the guide content system.

## Quick Start

### Check Translation Status

1. Visit `/en/draft` to see the draft dashboard
2. Look for guides with "Translations: X/18 locales" where X < 18
3. Click "Open draft" to see detailed breakdown per locale

### Fix Missing Translations

1. On the draft page, scroll to the **Publication checklist** section
2. Find the **Translations** item - it will auto-expand if incomplete
3. For each incomplete locale, you'll see:
   - The locale code (e.g., `pl`, `hu`)
   - A file path with a "Copy" button
4. Click "Copy" to get the file path, then open it in your editor
5. Replace placeholder strings with actual translations

## Placeholder Phrases by Locale

The system recognizes these phrases as "translation in progress" placeholders:

| Locale | Placeholder Phrase |
|--------|-------------------|
| it | Traduzione in arrivo |
| pl | Tłumaczenie w przygotowaniu |
| hu | A fordítás folyamatban van |
| en | Translation in progress |
| es | Traducción en progreso |
| fr | Traduction en cours |
| de | Übersetzung in Arbeit |
| ja | 翻訳準備中 |
| ko | 번역 준비 중 |
| zh | 翻译进行中 |
| pt | Tradução em andamento |
| ru | Перевод в процессе |

When these phrases are detected, the field is marked as "Missing" in the diagnostics.

## Translation File Structure

Translation files are located at:
```
apps/brikette/src/locales/{locale}/guides/content/{guideKey}.json
```

Example for Polish translation of `weekend48Positano`:
```
apps/brikette/src/locales/pl/guides/content/weekend48Positano.json
```

### File Format

```json
{
  "seo": {
    "title": "48 Hours in Positano - Weekend Guide",
    "description": "Plan your perfect weekend in Positano..."
  },
  "linkLabel": "48-Hour Positano Weekend",
  "intro": [
    "First paragraph of introduction...",
    "Second paragraph..."
  ],
  "sections": [
    {
      "id": "day-one",
      "title": "Day One",
      "body": ["Content for day one..."]
    }
  ],
  "faqs": [
    {
      "q": "What is the best time to visit?",
      "a": ["The best time to visit is..."]
    }
  ]
}
```

## Debugging Translation Issues

### Enable Debug Logging

Add `?debug=guides` to the URL to see translation-related console output:
```
http://localhost:3012/en/draft/guides/48-hour-positano-weekend?debug=guides
```

Or set localStorage:
```javascript
localStorage.setItem("debug:guides", "1");
```

### Common Issues

**Q: Why does my guide show English text when I'm viewing Polish?**

A: The system falls back to English when Polish translations are missing or contain placeholder phrases. Check the editorial panel to see which fields are incomplete.

**Q: What does "Translation coverage: 3/18 locales" mean?**

A: Only 3 out of 18 supported locales have complete translations. Complete means all of these are present and not placeholders:
- `intro` - Introduction paragraphs
- `sections` - All section titles and body content
- `faqs` - All FAQ questions and answers
- `seo` - Title and description

**Q: Why does the checklist say "complete" but I see placeholder text?**

A: If you're seeing this after recent updates, the placeholder detection may have been expanded. Reload the page to get fresh diagnostics.

**Q: How do I add a new locale?**

1. Create the directory: `apps/brikette/src/locales/{locale}/guides/content/`
2. Copy an English translation file as a template
3. Replace all strings with translations (or placeholder phrases initially)
4. The system will detect the new locale automatically

## CLI Commands

### Find all placeholders in a locale
```bash
grep -r "Tłumaczenie w przygotowaniu" apps/brikette/src/locales/pl/guides/content/
```

### Count placeholder instances
```bash
grep -r "Tłumaczenie w przygotowaniu" apps/brikette/src/locales/pl/ | wc -l
```

## Related Documentation

- [Implementation Plan](../../docs/plans/guide-translation-dx-improvements-plan.md)
- [Problem Audit](../../docs/plans/guide-translation-dx-problems.md)
