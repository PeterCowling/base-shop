---
Type: Idea
ID: SCAN-BRIK-001
Business: BRIK
Status: Draft
Owner: Unassigned
Created-Date: 2026-01-28
Tags: [scan-generated, review-needed, guides]
Source: Repository scan
Last-updated: 2026-02-05
---

# Review BRIK-OPP-0001: Santa Maria guide may be complete

## Finding
Card BRIK-OPP-0001 is in "In progress" lane but the guide file exists in the codebase, suggesting work may be done.

## Evidence
- **Card status**: Lane=In progress, Priority=P1
- **Card tasks**: Shows translations incomplete
- **File exists**: `apps/brikette/src/locales/en/guides/content/santaMariaDelCastelloHike.json` (6.2KB, created Jan 28)
- **Translation status**: Need to verify if translations were completed

## Recommendation
1. Check if translations are complete across all locales
2. Verify guide is integrated into routing system
3. If complete: Move to Done lane, create reflection
4. If incomplete: Update card with remaining tasks

## Next Actions
- Run `ls apps/brikette/src/locales/*/guides/content/santaMariaDelCastelloHike.json | wc -l` to count translations
- Check `apps/brikette/src/routes/guides/guide-manifest.ts` for routing integration
- Update card based on findings
