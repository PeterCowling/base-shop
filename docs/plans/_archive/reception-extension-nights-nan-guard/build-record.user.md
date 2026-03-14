# Build Record — Reception Extension Nights Input NaN Guard

**Date:** 2026-03-13
**Feature Slug:** `reception-extension-nights-nan-guard`
**Dispatch:** `IDEA-DISPATCH-20260313150000-0003`
**Business:** BRIK

## Outcome Contract

- **Why:** If a staff member clears the nights field, the system silently books 1 night when the button is clicked, with no warning. Staff have no indication the nights value has been reset.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The extend button is disabled when the nights field is empty, so staff cannot accidentally submit an unintended 1-night extension.
- **Source:** operator

## What Was Built

Added `|| Number.isNaN(nightsMap[r.occupantId])` to the `disabled` prop of both the Guest and Booking action buttons in `Extension.tsx`. When the nights input is cleared, `parseInt("", 10)` stores `NaN` in `nightsMap` — the buttons are now disabled in this state, preventing the silent 1-night fallback from being used.

Added regression test: clears the nights input, asserts Guest button is disabled, types a valid number, asserts button is re-enabled.

## Engineering Coverage Evidence

| Layer | Required | Evidence |
|---|---|---|
| Unit test — new behaviour | Required | `disables Guest button when nights input is cleared, re-enables when valid number entered` — passes |
| Unit test — existing regression | Required | All 5 prior Extension tests continue to pass (6 total) |
| Engineering coverage validator | Required | `validate-engineering-coverage.sh` → `valid: true` |

## Workflow Telemetry Summary

- Context input bytes: 34,683
- Modules loaded: `modules/build-code.md`
- Deterministic checks: `scripts/validate-engineering-coverage.sh`
