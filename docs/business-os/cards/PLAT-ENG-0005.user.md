---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: PLAT-ENG-0005
Title: Board Auto-Refresh Implementation Plan
Business: PLAT
Tags:
  - plan-migration
  - platform
Created: 2026-01-30T00:00:00.000Z
Updated: 2026-01-30T00:00:00.000Z
Status: Active
Last-updated: 2026-02-05
---
# Board Auto-Refresh Implementation Plan

**Source:** Migrated from `board-auto-refresh-plan.md`


# Board Auto-Refresh Implementation Plan

## Summary

Enable automatic board refresh when Business OS markdown documents change (cards, ideas, plans, stage docs). Currently the board shows a static snapshot at page load; users must manually refresh to see updates. This plan implements Phase 0 (worktree infrastructure) and Phase 1 (polling-based auto-refresh) to give users a live view of document changes within 30 seconds.

The implementation follows a two-phase approach: first establish the worktree-as-repoRoot architecture to ensure reads and writes operate on the same filesystem view, then add lightweight polling to detect changes via git HEAD and trigger client-side refresh.

## Goals

- Auto-refresh board when card frontmatter changes (Lane, Priority, Owner, etc.)
- Auto-refresh board when ideas are created/moved
- Detect changes from API mutations (all committed via RepoWriter)
- Multi-user support: User A sees changes made by User B without manual refresh
- 30-second refresh latency (good enough for Phase 1)

**Scope clarification:** "Plan tasks complete (reflected in corresponding cards)" is OUT OF SCOPE for this plan. The board currently reads cards + inbox ideas only (via `page.tsx`). Deriving card state from plan task completion would require a separate feature to parse plan docs and update card frontmatter/lane. This plan only refreshes the **current** board view when documents change.

## Non-goals

[... see full plan in docs/plans/board-auto-refresh-plan.md]
