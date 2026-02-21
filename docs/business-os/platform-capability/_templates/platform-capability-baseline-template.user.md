---
Type: Platform-Capability-Baseline
Status: Draft
Domain: Platform
Created: <YYYY-MM-DD>
Updated: <YYYY-MM-DD>
Last-reviewed: <YYYY-MM-DD>
Owner: <Owner>
Source: Deep Research + repo capability snapshot
---

# Platform Capability Baseline

## 1) Executive Summary

- 8-12 bullets on what the platform can and cannot do today.

## 2) Capability Snapshot Input

- Repo capability snapshot used for this run.
- Scope boundaries (apps/packages included, exclusions).

## 3) Reusable Building Blocks

- UI/components and design-system readiness.
- Shared backend/service primitives.
- Content/CMS primitives.
- Data and integration primitives.

## 4) Delivery Constraints

- Architecture constraints.
- Performance constraints.
- Security/compliance constraints.
- Testing constraints.
- Deployment/runtime constraints.

## 5) Website Upgrade Capability Matrix

| Capability area | Current strength | Proven in repo | Known limits | Notes |
|---|---|---|---|---|
| Site IA/navigation | <High/Med/Low> | <evidence> | <limits> | <notes> |
| PDP and conversion components | ... | ... | ... | ... |
| Checkout and payments | ... | ... | ... | ... |
| SEO and metadata | ... | ... | ... | ... |
| Analytics and monitoring | ... | ... | ... | ... |
| Localization | ... | ... | ... | ... |
| Content operations | ... | ... | ... | ... |

## 6) Gaps That Block Fast Website Upgrades

- Gap
  - Why it blocks delivery
  - Severity
  - Suggested mitigation pattern

## 7) Standards and Preferred Patterns

- Preferred implementation patterns to reuse.
- Anti-patterns to avoid.
- “Do first” checklist for new website upgrade work.

## 8) Fit-Scoring Rules for Reference Patterns

Define scoring rubric used by business upgrade briefs:
- User value impact (0-5)
- Conversion/commercial impact (0-5)
- Platform fit (0-5)
- Effort (0-5, inverse)
- Risk (0-5, inverse)

## 9) Freshness Contract

- Default refresh cadence: every 30 days.
- Force refresh triggers:
  - major platform change,
  - major dependency/runtime change,
  - significant channel or compliance change.

## 10) Source List

- URL + access date + confidence note.

## 11) HTML Companion (Required)

After saving this markdown file, render the browser-friendly companion:

```bash
pnpm docs:render-user-html -- docs/business-os/platform-capability/<YYYY-MM-DD>-platform-capability-baseline.user.md
```
