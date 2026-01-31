---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: BRIK-ENG-0009
Title: WYSIWYG Editor & New Guide Creation
Business: BRIK
Tags:
  - plan-migration
  - cms
Created: 2026-01-26T00:00:00.000Z
Updated: 2026-01-26T00:00:00.000Z
---
# WYSIWYG Editor & New Guide Creation

**Source:** Migrated from `guide-wysiwyg-editor-plan.md`


# WYSIWYG Editor & New Guide Creation

## Summary

Enhance the existing tabbed guide editor with WYSIWYG editing using Tiptap, **with formatting preservation** (bold, italic). Templates control base typography (font family, sizes) via prose classes while content contains semantic formatting tokens.

| Milestone | Focus | Effort | CI |
|-----------|-------|--------|-----|
| 1 | Install Tiptap + Markdown Codec (v2-compatible) | S | **90%** |
| 2 | Unified Token Parser + Block Renderer (+ SEO sanitization) | M | **90%** |
| 3 | Insert Guide Link UI | S | **92%** |
| 4 | Integrate WYSIWYG into Editor Tabs | M | **90%** |
| 5 | New Guide CLI Script | M | **90%** |
| 6 | Round-Trip Tests | S | **90%** |

**Total effort:** ~4-6 implementation sessions

Why higher than the initial estimate: the repo audit surfaced additional required work that materially affects scope (v2 markdown codec instead of a drop-in extension, multiple fallback renderers that need list/token support, and SEO/JSON-LD sanitization to avoid leaking `%LINK`/markdown into structured data).


[... see full plan in docs/plans/guide-wysiwyg-editor-plan.md]
