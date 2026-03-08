---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Products
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: xa-uploader-workflow-rebuild
Execution-Track: code
Deliverable-Type: code-change
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Trigger-Source: operator_idea
Trigger-Why: XA uploader single-screen flow creates high cognitive load and mixes mandatory, optional, inferred, and media-only concerns.
Trigger-Intended-Outcome: type: operational | statement: step workflow that allows draft without images and requires data+images for submission | source: operator
---

# XA Uploader Workflow Rebuild Fact-Find

## Key Findings

- Product authoring is rendered as one long section (`CatalogProductForm.client.tsx`) with identity, taxonomy, category specifics, and images all shown together.
- `createdAt` is user-editable in base fields despite being system metadata.
- Draft validation schema permits image-less products, but submission failure currently occurs later in ZIP generation.
- Submission selection UI currently does not distinguish draft-ready vs submission-ready products.

## Planning Direction

- Introduce step workflow (`data -> details -> images`).
- Derive/auto-fill `createdAt` and slug during persistence.
- Introduce shared readiness helper for:
  - data completeness,
  - image presence,
  - submission eligibility.
- Enforce submission image requirement both in UI and API (`reason: submission_images_missing`).

