# Goal Phase Module

Called by `/lp-do-worldclass` in States 2 and 3. Validates the goal artifact, checks version alignment with any existing research prompt, generates or refreshes the deep-research prompt, and decides whether to continue to scan-phase (State 3) or stop (State 2).

## Inputs

- `--biz <BIZ>` — from SKILL.md invocation
- `--as-of-date <YYYY-MM-DD>` — from SKILL.md invocation (defaults to today)
- Goal artifact: `docs/business-os/strategy/<BIZ>/worldclass-goal.md`
- Existing research prompt (may not exist): `docs/business-os/strategy/<BIZ>/worldclass-research-prompt.md`
- Existing benchmark (may not exist): `docs/business-os/strategy/<BIZ>/worldclass-benchmark.md`

## Step 1: Read and Validate Goal Artifact

Read `docs/business-os/strategy/<BIZ>/worldclass-goal.md`.

**If absent:** stop immediately with the State 1 error message from SKILL.md. Do not proceed to any further step.

**If present:** validate that all required fields exist:

| Field | Required | Notes |
|---|---|---|
| `schema_version` | Yes | Must be `worldclass-goal.v1` |
| `business` | Yes | Must match `--biz` value |
| `goal_version` | Yes | Integer ≥1 |
| `singular-goal` | Yes | Non-empty string |
| `domains` | Yes | List with at least 1 entry; each entry must have `name`, `context`, `examples` |
| `constraints` | Yes | List (may be empty) |
| `created` | Yes | YYYY-MM-DD |
| `last-updated` | Yes | YYYY-MM-DD |
| `benchmark-status` | Yes | One of: `none`, `research-prompt-ready`, `benchmark-ready` |

**Field missing or invalid:** stop with:

```
Error: worldclass-goal.md for <BIZ> is missing or has an invalid field.
Problem: <field name> — <brief description of the issue>
Fix the goal artifact at docs/business-os/strategy/<BIZ>/worldclass-goal.md using the template at docs/plans/lp-do-worldclass/worldclass-goal.template.md, then re-run.
```

**`goal_version` missing:** treat as version `0`; proceed but force prompt regeneration in Step 2.

## Step 2: Version-Check Research Prompt

Read the existing research prompt at `docs/business-os/strategy/<BIZ>/worldclass-research-prompt.md`.

Extract the `goal_version` field from its frontmatter.

**Regeneration required if any of the following:**
- Research prompt does not exist
- Research prompt frontmatter has no `goal_version` field
- `prompt.goal_version != goal.goal_version`
- `goal.goal_version` was treated as `0` in Step 1 (missing field)

**If regeneration not required:** proceed to Step 5 (skip Steps 3–4).

**If regeneration required:** proceed to Step 3.

## Step 3: Generate Deep-Research Prompt

Generate the content of the research prompt document. The prompt must contain all five sections below, in order.

### Section (a) — Business Context

```
Business: <BIZ>
Business type: <infer from strategy directory context — e.g. "boutique hostel, Positano, Amalfi Coast, Italy">
Operator-stated goal version: <goal_version>
Goal set on: <last-updated from goal artifact>
```

Supplement with any relevant context found in `docs/business-os/strategy/<BIZ>/` — brand strategy, offer docs, ICP docs — to give the research tool enough grounding to return relevant, specific results rather than generic advice.

### Section (b) — Singular Goal (verbatim)

Copy the `singular-goal` value from the goal artifact verbatim. Do not paraphrase.

```
Singular goal: "<singular-goal value>"
```

### Section (c) — Domain-by-Domain Research Instructions

For each domain in `goal.domains`, produce a named subsection `#### <domain.name>`:

```
Context: <domain.context verbatim>
Reference points provided by operator: <domain.examples as a bulleted list>

Research task:
For this domain, identify:
1. What does world-class look like right now (2025–2026)? Name 3–5 specific exemplars with concrete evidence of what makes them world-class in this domain.
2. What are the key indicators that distinguish world-class from merely good? List 5–8 measurable or observable indicators.
3. What is the minimum threshold — the lowest standard that could still be considered competitive — for a business of this type and scale?
4. What are the most common gaps between current-practice hospitality/[business-type] operators and world-class in this domain?
```

Replace `[business-type]` with the business type from Section (a). Iterate through all domains; do not summarise generically.

### Section (d) — Output Format Specification

```
## Required output format

The result of this research must be saved as a Markdown document with the following structure.

Frontmatter:
---
schema_version: worldclass-benchmark.v1
business: <BIZ>
goal_version: <goal_version>
generated_at: <YYYY-MM-DD when research was run>
domains:
  - id: <lowercase-hyphenated domain name>
    name: <domain.name as written above>
  (one entry per domain)
---

Body: one top-level section per domain, using EXACTLY this heading format:
## [<domain_id>] <Domain Name>

Under each domain section, include ALL FOUR of these subsections:

### Current Best Practice
<2–4 paragraph description of what world-class looks like in this domain right now, with named exemplars>

### Exemplars
<Bullet list of 3–5 named exemplars with a one-sentence description of what makes each world-class in this domain>

### Key Indicators
<Bullet list of 5–8 measurable or observable indicators that distinguish world-class from merely good>

### Minimum Threshold
<1–2 sentences: the lowest bar a business of this type and scale must clear to be considered competitive in this domain>

Do not add extra sections. Do not merge domains. If a domain has no strong exemplars available, note that explicitly in the Exemplars section rather than omitting it.
```

### Section (e) — Constraints to Respect

```
## Constraints for this research

All findings, exemplars, and recommendations must be compatible with the following constraints.
<constraints from goal artifact, one bullet per item>

Research that violates these constraints (e.g. recommending luxury-only solutions for an affordable-luxury operator) should be explicitly flagged as out-of-scope and replaced with the closest in-scope alternative.
```

## Step 4: Write Research Prompt

Write the generated prompt to `docs/business-os/strategy/<BIZ>/worldclass-research-prompt.md`.

**Document structure:**

```markdown
---
schema_version: worldclass-research-prompt.v1
business: <BIZ>
goal_version: <goal.goal_version>
generated_at: <--as-of-date>
domains: <same list as goal.domains, by name>
---

# World-Class Research Prompt — <BIZ>

> Generated by `/lp-do-worldclass` on <--as-of-date>.
> Run this prompt in a deep-research tool (e.g. Perplexity Deep Research, Claude extended thinking, or equivalent).
> Paste the result as `docs/business-os/strategy/<BIZ>/worldclass-benchmark.md` with the frontmatter shown in Section (d) above.
> Set `benchmark-status: benchmark-ready` in `worldclass-goal.md` once the benchmark is in place.

<insert Sections a, b, c, d, e in order>
```

After writing: update `benchmark-status` in the goal artifact to `research-prompt-ready`.

**Updating benchmark-status in goal artifact:** edit `docs/business-os/strategy/<BIZ>/worldclass-goal.md`, change `benchmark-status: none` (or current value) to `benchmark-status: research-prompt-ready`.

## Step 5: Decide Continue or Stop

After Steps 3–4 complete (or if they were skipped in Step 2), evaluate:

**Continue to scan-phase (State 3)** if ALL of the following are true:
- `docs/business-os/strategy/<BIZ>/worldclass-benchmark.md` exists and is non-empty
- Benchmark frontmatter `goal_version` == `goal.goal_version`
- Benchmark frontmatter `schema_version` == `worldclass-benchmark.v1`

**Stop (State 2 or 4)** if any check above fails. Emit the appropriate stop message from SKILL.md.

**If benchmark was just regenerated in Steps 3–4** (prompt was refreshed because goal_version changed): always stop. The old benchmark is stale and must be replaced before a scan can proceed. Emit the State 4 stop message even if a benchmark file exists, because it will have a mismatched `goal_version`.

**If benchmark is missing entirely:** stop with the State 2 stop message.
