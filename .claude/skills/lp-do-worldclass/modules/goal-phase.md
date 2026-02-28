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

**Parsing invariant:** parse only the first YAML frontmatter block at the very top of the file (the block delimited by `---` on lines 1 and N). Ignore any `---` sequences that appear later in the file. This invariant applies to any implementation — agent, TypeScript, or otherwise — and must not be bypassed.

**If present:** validate that all required fields exist:

| Field              | Required | Notes                                                                          |
| ------------------ | -------- | ------------------------------------------------------------------------------ |
| `schema_version`   | Yes      | Must be `worldclass-goal.v1`                                                   |
| `business`         | Yes      | Must match `--biz` value                                                       |
| `goal_version`     | Yes      | Integer ≥1                                                                     |
| `singular-goal`    | Yes      | Non-empty string                                                               |
| `domains`          | Yes      | List with at least 1 entry; each entry must have `name`, `context`, `examples`; `id` is optional — see Domain id rules below |
| `constraints`      | Yes      | List (may be empty)                                                            |
| `created`          | Yes      | YYYY-MM-DD                                                                     |
| `last-updated`     | Yes      | YYYY-MM-DD                                                                     |
| `benchmark-status` | Yes      | One of: `none`, `research-prompt-ready`, `benchmark-ready`                     |

**Domain id rules (applies when any domain has an explicit `id` field):**

- **Format:** each `id` must match `^[a-z0-9]+(?:-[a-z0-9]+)*$` — lowercase alphanumeric and hyphens; no underscores, spaces, or uppercase.
- **Uniqueness:** all explicit `id` values must be unique across the domains list.
- **`name` is display-only when `id` is present:** when a domain has an explicit `id`, `name` is used only for display and research prompt text. Renaming `name` without changing `id` does NOT change domain_id and does NOT require a `goal_version` bump.
- **Derived path (no `id`):** if `id` is absent, domain_id is derived from `name` (lowercased, spaces → hyphens). Renaming `name` in the no-id path changes domain_id — bump `goal_version` before renaming.

If any domain `id` fails format or uniqueness, stop with:

```
Error: worldclass-goal.md for <BIZ> has an invalid domain id.
Domain: <domain.name>
Problem: <"id does not match required format ^[a-z0-9]+(?:-[a-z0-9]+)*$" | "duplicate id — must be unique across all domains">
Fix the domain id in docs/business-os/strategy/<BIZ>/worldclass-goal.md, then re-run.
```

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

**Before generating sections — compute `goal_contract_hash`:**

Compute this hash from the validated goal artifact. It is written to both the research prompt frontmatter (Step 4) and the benchmark output format spec (Section d), enabling automatic detection of goal contract drift even when `goal_version` was not bumped.

```
resolved_domain_ids  = for each domain: use domain.id if present, else lowercase-hyphenate domain.name
contract_string      = <singular-goal>
                     + "||"
                     + sort(resolved_domain_ids).join(",")
                     + "||"
                     + sort(constraints).join("|")
goal_contract_hash   = sha256(contract_string) — lowercase hex (64 chars)
```

Both `resolved_domain_ids` and `constraints` are sorted alphabetically before joining — this makes the hash order-independent (reordering domains or constraints in the goal does not change the hash).

If SHA-256 is not feasible in the agent runtime: use the fallback `<contract_string[:40]>-fp` padded to 64 characters with `0`. Same fallback pattern as ideas-phase deterministic keys. Document the fallback in the research prompt frontmatter as `goal_contract_hash_method: fallback`.

---

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
  - id: <domain_id — use domain.id if present in the goal artifact; otherwise derive as lowercase-hyphenated domain.name>
    name: <domain.name as written above>
  (one entry per domain; the id values here must exactly match the ## [<domain_id>] headings in the body below)
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
goal_contract_hash: <computed in Step 3>
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

After writing: update `benchmark-status` in the goal artifact conditionally:

**Updating benchmark-status in goal artifact:** edit `docs/business-os/strategy/<BIZ>/worldclass-goal.md` using the following rule:

- If benchmark **does not exist** OR `benchmark.goal_version != goal.goal_version` → set `benchmark-status: research-prompt-ready`
- If benchmark **exists AND** `benchmark.goal_version == goal.goal_version` AND `benchmark.schema_version == worldclass-benchmark.v1` → set `benchmark-status: benchmark-ready` (or leave unchanged if already `benchmark-ready`)

Do NOT downgrade `benchmark-ready` to `research-prompt-ready` when the only reason for prompt regeneration was a missing or corrupt prompt file.

## Step 5: Decide Continue or Stop

After Steps 3–4 complete (or if they were skipped in Step 2), evaluate:

**Continue to scan-phase (State 3)** if ALL of the following are true:

- `docs/business-os/strategy/<BIZ>/worldclass-benchmark.md` exists and is non-empty
- Benchmark frontmatter `goal_version` == `goal.goal_version`
- Benchmark frontmatter `schema_version` == `worldclass-benchmark.v1`

**Stop (State 2 or 4)** if any check above fails. Emit the appropriate stop message from SKILL.md.

**Stop decision is based on benchmark validity — not on whether the research prompt was just regenerated.** If the benchmark is current and valid (all three checks above pass), proceed to scan-phase regardless of whether the prompt was just regenerated (e.g. the prompt file was missing or had an old version).

**If benchmark is missing entirely:** stop with the State 2 stop message.

**If benchmark.goal_version != goal.goal_version:** stop with the State 4 stop message. (The research prompt has now been refreshed by Steps 3–4; the operator can use it immediately.)

**Additional check — goal contract hash drift (run only when all three checks above pass):**

If `benchmark.goal_contract_hash` is present in the benchmark frontmatter, compute `goal_contract_hash` from the current goal artifact using the formula from Step 3. This computation is deterministic from goal content and may be run at any step regardless of whether Steps 3–4 executed.

- If `benchmark.goal_contract_hash` is absent → proceed (benchmark predates this check; `goal_version` match is sufficient)
- If present AND matches computed hash → proceed to scan-phase
- If present AND does NOT match computed hash → stop with:

```
Error: worldclass-goal.md and worldclass-benchmark.md for <BIZ> have diverged.
goal_contract_hash in benchmark: <benchmark value>
goal_contract_hash computed now:  <computed value>
goal_version:                     <goal.goal_version> (unchanged — hash mismatch means contract changed without a version bump)

The goal contract (singular-goal, domain ids, or constraints) was modified without bumping goal_version.
The benchmark no longer matches the current goal.
Fix: bump goal_version in docs/business-os/strategy/<BIZ>/worldclass-goal.md, set benchmark-status: none,
then re-run /lp-do-worldclass --biz <BIZ> to regenerate the research prompt. Paste a fresh benchmark before scanning.
```
