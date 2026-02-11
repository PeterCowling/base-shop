---
Type: Card
Lane: Fact-finding
Priority: P2
Owner: Pete
ID: PIPE-ENG-0002
Title: Edge Commerce Standardization Implementation
Business: PIPE
Tags:
  - plan-migration
  - 'platform,-commerce'
Created: 2025-12-26T00:00:00.000Z
Updated: 2026-01-17T00:00:00.000Z
Status: Active
Last-updated: 2026-02-05
---
# Edge Commerce Standardization Implementation

**Source:** Migrated from `edge-commerce-standardization-implementation-plan.md`


<!-- docs/plans/edge-commerce-standardization-implementation-plan.md -->

Unified Edge Routing + Multi‑Tenant Commerce Standardization Implementation Plan
Audience

Product, Engineering, Ops, Finance

Purpose

Implement a single scalable Cloudflare routing + deployment model that:

supports many shops and domains without “project per shop” sprawl,

preserves host-only cart cookies (same-host cart → checkout),

standardizes all existing commerce API surfaces already present in the repo (not just cart/checkout/webhooks),

guarantees a single inventory authority (validate now, reserve with TTL next),


[... see full plan in docs/plans/edge-commerce-standardization-implementation-plan.md]
