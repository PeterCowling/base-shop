# Agent Persistent Context — Index

This directory contains cross-agent memory: facts, constraints, and reference material that
all agents (Claude, Codex, etc.) should load at the start of a session when the relevant
topic arises. Read the file for a topic before acting on it.

## Infrastructure & Deployment

| File | What it covers |
|---|---|
| `cloudflare-api.md` | CF account ID, token verification pattern, DNS zone IDs, wrangler auth fix (must set `CLOUDFLARE_ACCOUNT_ID`), Pages domain API |
| `reference-inventory-uploader.md` | Deployed Worker URL, Neon project/DB details, Prisma/CF adapter architecture, KV binding, wrangler secrets |
| `payment-manager.md` | Payment Manager Worker — live URL, Prisma models, API routes, secrets list, build/deploy instructions, Caryina integration, local dev setup |

## Data Access

| File | What it covers |
|---|---|
| `data-access.md` | Firebase RTDB paths and access methods, staff UIDs, GA4 via MCP, BOS Agent API auth |

## App-Specific Procedures

| File | What it covers |
|---|---|
| `reference-reception-login.md` | React fiber login trick for localhost:3023 — Playwright `fill` does NOT work |
| `reference-reception-navigation.md` | Keyboard-modal navigation (no sidebar), all 4 modal contents with routes |
| `reference-codex-isolated-runner.md` | Verified Codex model (`gpt-5.4`), isolated home seeding, prompt design rules |

## Decisions & Feedback

| File | What it covers |
|---|---|
| `feedback-bos-i18n.md` | BOS process improvements is English-only — no i18n needed |

---

> **Maintainers:** add new files here when significant operational facts are established.
> Keep entries brief — one line per file. Full detail lives in the file itself.
