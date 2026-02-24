---
Type: Reference
Status: Active
Domain: Startup Loop
---

# Standing Doc Hygiene Schema

**Version:** 1.0
**Applies to:** All standing `.user.md` documents in `docs/business-os/startup-baselines/` and `docs/business-os/strategy/`
**Enforced by:** `scripts/src/docs-lint.ts` hygiene check (warning mode for existing docs; hard-fail for docs created after 2026-02-22)

---

## Purpose

Standing documents accumulate staleness silently. The hygiene schema defines the minimum set of frontmatter fields that make staleness explicit and auditable. These fields allow the startup-loop agent and human operators to detect when a standing doc needs refreshing, who is responsible for refreshing it, and how confident the current content is.

The schema is intentionally lightweight: it does not replace the substantive content of each doc, only adds a metadata layer that can be read without opening the full document.

---

## Required Hygiene Fields

The following 8 fields must appear in the YAML frontmatter of every qualifying standing doc.

### 1. `Owner:`

**Format:** Free text — name of an operator, team, or role
**Purpose:** Identifies who is accountable for keeping the document current. If a refresh is needed, this is the person or team to contact.

```yaml
Owner: Pete
```

```yaml
Owner: Marketing lead
```

**Rules:**
- Must be a non-empty string
- May reference a role rather than a named individual for shared ownership

---

### 2. `Review-trigger:`

**Format:** Free text — a condition description
**Purpose:** Describes the event or condition that should prompt a review of this document. This makes the refresh cadence explicit rather than relying on calendar-based schedules.

```yaml
Review-trigger: After each completed build cycle that touches product scope
```

```yaml
Review-trigger: When a new distribution channel is activated or dropped
```

```yaml
Review-trigger: After each S10 weekly decision that changes the prioritised hypothesis
```

**Rules:**
- Must be a non-empty string
- Should reference a concrete event in the startup-loop or business lifecycle
- Avoid vague triggers like "periodically" — prefer conditions tied to observable events

---

### 3. `Confidence:`

**Format:** Numeric `0.0`–`1.0` **or** one of `High`, `Medium`, `Low`
**Purpose:** Expresses the operator's overall confidence in the accuracy and completeness of the document's content at the time of last update.

```yaml
Confidence: 0.7
```

```yaml
Confidence: Medium
```

**Scale (numeric):**
| Range | Interpretation |
|-------|---------------|
| 0.0–0.3 | Low — significant gaps or unverified assumptions |
| 0.4–0.6 | Medium — directionally correct but gaps remain |
| 0.7–0.9 | High — verified with primary evidence |
| 1.0 | Complete — exhaustively verified |

**Rules:**
- Numeric value must be in the range `[0.0, 1.0]`
- Categorical values are `High`, `Medium`, or `Low`
- Do not mix formats within a single document

---

### 4. `Confidence-reason:`

**Format:** Single sentence
**Purpose:** Explains the primary factor driving the stated confidence level. This prevents the numeric or categorical rating from being opaque.

```yaml
Confidence-reason: Based on 3 confirmed operator interviews; pricing assumptions not yet validated with end customers.
```

```yaml
Confidence-reason: Derived from desk research only — no primary customer data collected yet.
```

**Rules:**
- Must be a single sentence (ending with a period)
- Must reference the primary evidence source or the primary gap
- Do not write generic statements like "best estimate" — be specific about what is or is not known

---

### 5. `Last-updated:`

**Format:** ISO date `YYYY-MM-DD`
**Purpose:** Records when the substantive content of the document was last changed. This is distinct from `Last-reviewed:` (where the content was checked but may not have changed).

```yaml
Last-updated: 2026-02-22
```

**Rules:**
- Must be a valid ISO date
- Must be updated whenever the body content changes, not just the metadata fields
- Distinct from `Last-reviewed:` — a review without content changes does not update this field

---

### 6. `Evidence:`

**Format:** Brief pointer — file path, URL, or short description
**Purpose:** Identifies the primary evidence source that underpins the document's content. Enables rapid verification without reading the entire doc.

```yaml
Evidence: docs/business-os/strategy/HEAD/current-situation.user.md
```

```yaml
Evidence: 3 customer interviews conducted 2026-02-10 (notes: docs/plans/head-discovery/interview-notes.md)
```

```yaml
Evidence: Octorate booking data export 2026-02-15
```

**Rules:**
- Must be a non-empty string
- File paths should be relative to the repo root
- If multiple evidence sources exist, cite the single most authoritative one; additional sources may be listed in the doc body

---

### 7. `Open-questions:`

**Format:** YAML list (may be empty)
**Purpose:** Tracks unanswered questions about the document's content. An empty list signals that no known gaps exist. A populated list signals active uncertainty that should be resolved before the next build cycle decision.

```yaml
Open-questions:
  - Has the target customer segment been validated with primary research?
  - Are the pricing benchmarks still current after Q1 2026 market shifts?
```

```yaml
Open-questions: []
```

**Rules:**
- Field must be present even when empty (`Open-questions: []`)
- Each item should be a complete question (ending with `?`)
- Questions should be specific enough to guide a fact-finding task
- Resolved questions should be removed and optionally noted in `Change-log:`

---

### 8. `Change-log:`

**Format:** YAML list of dated entries, newest first
**Purpose:** Provides a running history of substantive changes to the document. Enables operators and agents to understand the document's evolution without reading full git history.

```yaml
Change-log:
  - 2026-02-22 — Initial draft created from ASSESSMENT-08 output
  - 2026-02-10 — Added pricing benchmarks section; revised confidence to 0.6
```

**Rules:**
- Field must be present; may contain a single entry for newly created docs
- Each entry must include a date (`YYYY-MM-DD`) and a brief description
- Entries are listed newest-first
- Metadata-only changes (e.g., updating `Owner:`) do not require a new entry unless the change is operationally significant

---

## Suppression

If a legacy document cannot currently be updated to meet the hygiene schema, add the following comment anywhere in the document body (not frontmatter):

```
<!-- HYGIENE-EXEMPT: <reason> [ttl=YYYY-MM-DD] -->
```

- `<reason>` must explain why the exemption is needed
- `ttl` (time-to-live) is the date by which the exemption should be resolved
- Hygiene-exempt docs are excluded from the lint warning, but will be surfaced in the standing info gap analysis

---

## Enforcement

The `scripts/src/docs-lint.ts` hygiene check applies the following rules:

| Scope | Fields checked | Mode |
|-------|---------------|------|
| `docs/business-os/startup-baselines/` and `docs/business-os/strategy/` `.user.md` files | `Review-trigger:` and `Owner:` | Warning (existing docs) |
| Same scope, doc created after 2026-02-22 | `Review-trigger:` and `Owner:` | Hard-fail |
| Any doc with `<!-- HYGIENE-EXEMPT: ... -->` | All hygiene fields | Suppressed |

The full schema (all 8 fields) is advisory for existing docs. Only `Owner:` and `Review-trigger:` are lint-enforced. The remaining 6 fields are strongly recommended and will be surfaced in audit reports.

---

## Example Compliant Frontmatter

```yaml
---
Type: Startup-Intake-Packet
Status: Active
Business: HEAD
Owner: Pete
Review-trigger: After each completed build cycle touching product scope or distribution channels
Confidence: 0.7
Confidence-reason: Built from ASSESSMENT-01 through ASSESSMENT-08 outputs; pricing assumptions unvalidated with end customers.
Last-updated: 2026-02-22
Evidence: docs/business-os/strategy/HEAD/current-situation.user.md
Open-questions:
  - Has the primary customer persona been validated with direct interviews?
Change-log:
  - 2026-02-22 — Hygiene fields added; no content changes
---
```
