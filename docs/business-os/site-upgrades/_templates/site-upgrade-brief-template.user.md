---
Type: Site-Upgrade-Brief
Status: Draft
Business: <BIZ>
Created: <YYYY-MM-DD>
Updated: <YYYY-MM-DD>
Last-reviewed: <YYYY-MM-DD>
Owner: <Owner>
Platform-Baseline: docs/business-os/platform-capability/<YYYY-MM-DD>-platform-capability-baseline.user.md
---

# <BIZ> Site Upgrade Brief

## 1) Business Outcome Frame

- Target outcome(s) this upgrade must support.
- Decision links this upgrade unlocks.

## 2) Existing Site Baseline

- Current site state and biggest friction points.
- Current launch-surface mode (`pre-website` or `website-live`).

## 3) Reference Sites

- Named reference sites and why each matters.

## 3A) Exemplar Image Shot-Board (L1 Build 2 image-first mode)

Use this section when WEBSITE-02 runs as L1 Build 2 for visual-heavy catalogs.

| Reference site | Page URL | Shot type (hero/PLP/PDP/detail/on-body/cross-sell) | Why it matters | Evidence |
|---|---|---|---|---|

## 4) Pattern Decomposition

| Reference site | Pattern | Why it matters | Evidence |
|---|---|---|---|

## 5) Best-Of Synthesis Matrix

| Pattern | Source reference | User value | Conversion impact | Platform fit | Effort | Risk | Classification (Adopt/Adapt/Defer/Reject) | Rationale |
|---|---|---:|---:|---:|---:|---:|---|---|

## 6) Design Implications

- Information architecture implications.
- Page/component implications.
- Copy/messaging implications.
- Trust and support implications.
- Image hierarchy implications (homepage/PLP/PDP) and media-to-copy balance.

## 7) Technical Implications

- Reusable platform primitives to use.
- New build requirements.
- Testing and observability implications.

## 7A) Image-Heavy Delivery Contract (L1 Build 2 image-first mode)

| Surface | Required media behavior | Acceptance criteria | Dependencies | Evidence refs |
|---|---|---|---|---|

## 8) Prioritized Backlog Candidates

| Priority | Item | Why now | Acceptance criteria | Dependencies | Evidence refs |
|---|---|---|---|---|---|

## 9) Open Questions

- Questions that block accurate tasking in lp-do-fact-find/lp-do-plan.

## 10) Source List

- URL + access date.

## 11) HTML Companion (Required)

After saving this markdown file, render the browser-friendly companion:

```bash
pnpm docs:render-user-html -- docs/business-os/site-upgrades/<BIZ>/<YYYY-MM-DD>-upgrade-brief.user.md
```
