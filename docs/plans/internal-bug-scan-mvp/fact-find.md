---
Type: Fact-Find
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-02
Last-reviewed: 2026-03-02
Owner: Codex
Relates-to charter: docs/business-os/business-os-charter.md
---

# Internal Bug Scan MVP Fact-Find

## Summary
Base-Shop currently relies on strong lint/typecheck plus CI security checks, but has no dedicated lightweight semantic bug scanner tuned for changed files. External tool UBS adds capability but is not a good direct fit because its install path is invasive and supply-chain posture is not aligned with repository guardrails. The opportunity is an in-repo scanner with deterministic behavior, no shell/profile mutation, and rules tailored to this codebase.

## Current State
- Local validation gate: `scripts/validate-changes.sh`.
- Pre-commit gate: `scripts/git-hooks/pre-commit.sh`.
- CI security signals: dependency audit + trufflehog in `.github/workflows/ci.yml`.
- No project-native `bug-scan` command for changed-file focused semantic bug checks.

## Problem
High-signal bug patterns can still escape lint/typecheck, especially dangerous runtime patterns and unsafe assertions. Current gates do not provide a repository-specific scanner pass focused on those categories.

## Outcome Contract
- **Why:** Add a deterministic, repository-native bug scanning layer that improves early detection of risky code patterns without introducing invasive external installers.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Deliver an MVP internal scanner and integrate runnable commands for manual and changed-file scans, with validation proving typecheck/lint compatibility.
- **Source:** operator

## Scope for MVP
- Add scanner script under `scripts/src/quality/`.
- Add root npm scripts:
  - `bug-scan`
  - `bug-scan:changed`
- Implement high-signal initial rules only.
- Produce text and JSON output plus non-zero exit on findings.

## Out of Scope
- CI blocking gate.
- Full rule engine with hundreds of rules.
- Auto-fix transformations.
