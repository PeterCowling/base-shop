---
Type: Card
Lane: Done
Priority: P3
Owner: Pete
ID: BRIK-ENG-0016
Title: Work Idea Inline Edit Plan
Business: BRIK
Tags:
  - plan-migration
  - ui
Created: 2026-01-29T00:00:00.000Z
Updated: 2026-01-29T00:00:00.000Z
---
# Work Idea Inline Edit Plan

**Source:** Migrated from `work-idea-inline-edit-plan.md`


# Work Idea Inline Edit Plan

## Summary

Add inline editing functionality to the "Work Idea" button on idea detail pages. When clicked, users can edit the idea content directly on the page using a textarea with markdown preview. Saving transitions the idea Status from "raw" to "worked" (one-way). This enables users to refine ideas before converting them to cards, without navigating to a separate page or using the full `/work-idea` agent skill.

## Goals

- Enable inline editing of idea content on idea detail page
- Allow users to refine raw ideas into worked ideas (Status: "raw" → "worked")
- Provide simple markdown editing experience (textarea + preview toggle)
- Save changes via git worktree pattern (consistent with existing patterns)
- Replace "Work Idea (Coming Soon)" placeholder with functional button

## Non-goals

- Moving idea files between inbox/ and worked/ directories (existing `/work-idea` skill handles that)
- Creating cards from ideas (existing "Convert to Card" button handles that)
- Full WYSIWYG markdown editor (Phase 0: simple textarea sufficient)

[... see full plan in docs/plans/work-idea-inline-edit-plan.md]
