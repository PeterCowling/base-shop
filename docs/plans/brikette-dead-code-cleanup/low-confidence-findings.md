---
Type: Note
Status: Active
Domain: UI
Last-reviewed: 2026-03-10
Relates-to: docs/plans/brikette-dead-code-cleanup/plan.md
---

# Low-Confidence Findings

Source: March 10, 2026 `dead-code-audit --app=brikette --format=json`

## Disposition Matrix

| File | Audit reason | Evidence gathered | Disposition |
|---|---|---|---|
| `apps/brikette/src/app/[lang]/book-dorm-bed/page.tsx` | Route segment not in internal segment registry | Route is explicitly referenced by redirect normalization and live Brikette funnel scripts. Comments describe it as the canonical published booking route. | Keep |
| `apps/brikette/src/app/[lang]/hospitality-preview/page.tsx` | Route segment not in internal segment registry | No traced consumer beyond the page file itself. The page appears to be an internal preview surface using hospitality UI components. | Defer pending operator intent |
| `apps/brikette/src/lib/seo-audit/index.ts` | Only referenced in one test file according to audit | Multiple scripts import the module directly (`audit-guide-seo.ts`, `run-audit-cli.ts`, `run-audit-temp.ts`, `test-audit.ts`). | Keep |
| `apps/brikette/src/lib/buildHostelSchema.ts` | Only referenced in one test file according to audit | Only test references were found during this pass. No production or script consumers were found. | Delete candidate |
| `apps/brikette/src/utils/validate.ts` | Only referenced in one test file according to audit | Only test references were found during this pass. No production or script consumers were found. | Delete candidate |
| `apps/brikette/src/utils/parseAmaKeywords.ts` | Only referenced in one test file according to audit | Only test references were found during this pass. No production or script consumers were found. | Delete candidate |
| `apps/brikette/src/utils/guideLinks.ts` | Only referenced in one test file according to audit | Only test references were found during this pass. No production or script consumers were found. | Delete candidate |
| `apps/brikette/src/utils/buildNavLinks.ts` | Only referenced in one test file according to audit | Only test references were found during this pass. No production or script consumers were found. | Delete candidate |

## Notes

- `book-dorm-bed` is a confirmed false positive and should not return to any deletion tranche unless new contradictory evidence appears.
- `hospitality-preview` is the one remaining route where the repo evidence does not say whether it is intentionally retained. That decision should be made explicitly at the checkpoint instead of silently deleting it.

## Recommended TASK-06 Input

Safe delete candidates once the checkpoint approves them:

- `apps/brikette/src/lib/buildHostelSchema.ts`
- `apps/brikette/src/utils/validate.ts`
- `apps/brikette/src/utils/parseAmaKeywords.ts`
- `apps/brikette/src/utils/guideLinks.ts`
- `apps/brikette/src/utils/buildNavLinks.ts`

Keep:

- `apps/brikette/src/app/[lang]/book-dorm-bed/page.tsx`
- `apps/brikette/src/lib/seo-audit/index.ts`

Needs explicit intent decision:

- `apps/brikette/src/app/[lang]/hospitality-preview/page.tsx`
