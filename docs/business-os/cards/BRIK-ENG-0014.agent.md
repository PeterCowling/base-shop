---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: BRIK-ENG-0014
Title: Remove Gallery Feature Plan
Business: BRIK
Tags:
  - plan-migration
  - cms
Created: 2026-01-30T00:00:00.000Z
Updated: 2026-01-30T00:00:00.000Z
Status: Active
Last-updated: 2026-02-05
---
# Remove Gallery Feature Plan

**Source:** Migrated from `remove-gallery-feature-plan.md`


# Remove Gallery Feature Plan

## Summary

Remove the gallery block feature from the guides system completely. Gallery images from the 2 guides currently displaying galleries (`positanoBeaches` and `luggageStoragePositano`) will be migrated inline into guide sections using the existing `section.images` array support. All gallery-related code (block handlers, components, types, schemas, dev tools, SEO audit logic) will be removed. Gallery JSON data from 29 guide files across 18 locales will be cleaned up.

## Goals

- Remove all gallery-related code from guides system
- Migrate gallery images inline for 2 active galleries (positanoBeaches with 8 images, luggageStoragePositano)
- Remove gallery validation from SEO audit
- Remove gallery section from dev guidelines panel
- Clean up gallery JSON from 29 guide files × 18 locales

## Non-goals

- Keeping gallery as deprecated/hidden feature
- Creating new generic image block system
- Migrating images for guides with unused gallery JSON (just delete the data)

[... see full plan in docs/plans/remove-gallery-feature-plan.md]
