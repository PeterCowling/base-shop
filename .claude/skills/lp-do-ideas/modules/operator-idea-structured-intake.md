# Operator Idea Structured Intake

Use this module only when Step 2 classified the input as `operator_idea`.

Goal: replace free-form follow-up inference with a short structured intake that still
produces the fields required by the current dispatch contract. This module does not
decide the final route. Step 4 in `SKILL.md` still owns routing judgment.

## Rules

- Ask the five core questions in order.
- Keep answers terse. Prefer short fields over narrative prose.
- If the operator reports multiple distinct gaps, split them before routing. Re-run
  Questions 3-5 for each gap.
- Do not leave `location_anchors` empty. If no file path is known, capture at least one
  route, endpoint, doc name, log anchor, or user-flow label.
- Do not guess evidence fields from the opening paragraph once the structured prompts
  start. Use the conditional prompts below instead.

## Five Core Questions

### Question 1 - Business

Ask:

> Which business is this for? Use the business code if you know it (for example `HBAG`, `BRIK`, `HEAD`, `PLAT`).

Capture:
- `business`

### Question 2 - Gap Count

Ask:

> Is this one gap or multiple distinct gaps? Answer `one` or `multiple`.

Capture:
- decomposition decision for Step 4 packet emission

### Question 3 - Area Label

Ask:

> What short area label should name this gap? Use 2-5 words, noun phrase only.

Good:
- `checkout tracking`
- `hostel pricing playbook`
- `Prime outbound reliability`

Bad:
- `we need to rethink how pricing works for the hostel business`

Capture:
- `area label`

### Question 4 - Location Anchors

Ask:

> Where is this anchored? Give 1-5 paths, routes, endpoints, docs, logs, or user flows.

Examples:
- `apps/reception/src/lib/inbox/draft-pipeline.server.ts`
- `/checkout`
- `docs/business-os/strategy/BRIK/channel-plan.user.md`
- `payment webhook retries`
- `booking flow: offer modal -> checkout`

Capture:
- `location_anchors`

### Question 5 - Gap Shape

Ask:

> Answer in this format: `<gap clause> | <domain> | <provisional deliverable family>`

Allowed `domain` values:
- `MARKET`
- `SELL`
- `PRODUCTS`
- `LOGISTICS`
- `STRATEGY`

Allowed `provisional deliverable family` values:
- `code-change`
- `doc`
- `multi`
- `business-artifact`
- `design`
- `infra`

Examples:
- `no canonical pricing playbook exists | SELL | business-artifact`
- `payment retry path fails silently | SELL | code-change`
- `Prime and Reception need one drafting contract | STRATEGY | multi`

Capture:
- `gap clause`
- `domain`
- `provisional_deliverable_family`

## Conditional Evidence Prompts

After the five core questions, ask only the prompts triggered by the operator's answers.
Skip any prompt that clearly does not apply.

### Incident / outage

Ask if the gap is an active failure, outage, or known broken path:

> Is there an active incident or outage tied to this gap? If yes, give `incident_id`. If you have a repro/log reference, give that too.

Capture:
- `incident_id`
- `repro_ref`

### Deadline / launch date

Ask if the operator mentions time pressure:

> Is there a real deadline or launch date for this? If yes, give `deadline_date` in `YYYY-MM-DD`.

Capture:
- `deadline_date`

### Recurrence

Ask if the gap is recurring:

> Has this happened before? If yes, give `first_observed_at` or the best known date.

Capture:
- `first_observed_at`

### Leakage / cost

Ask if the operator mentions loss or wasted work:

> Is there an estimated loss or leakage? If yes, give `<value> | <unit>` such as `50 | USD/day`.

Capture:
- `leakage_estimate_value`
- `leakage_estimate_unit`

### Risk exposure

Ask if legal, safety, security, privacy, or compliance risk is involved:

> Does this create legal, safety, security, privacy, or compliance risk? If yes, answer `<risk_vector> | <risk_ref>`.

Capture:
- `risk_vector`
- `risk_ref`

### Metric / funnel impact

Ask if the gap affects a tracked KPI or conversion step:

> Is a metric or funnel step breaking? If yes, answer either `<failure_metric> | <baseline_value>` or `<funnel_step> | <metric_name> | <baseline_value>`.

Capture:
- `failure_metric`
- `baseline_value`
- `funnel_step`
- `metric_name`

### Engineering coverage hints (code-bearing only)

Ask only when `provisional deliverable family` is likely code-bearing (`code-change`, `multi`, `infra`, `design`):

> Which engineering surfaces are likely affected? Answer comma-separated using any of: `UI`, `UX`, `security`, `observability`, `testing`, `data-contracts`, `performance-reliability`, `rollout-rollback`. If none are obvious, answer `unknown`.

Capture:
- `coverage_hints`

## Deterministic Assembly Rules

Build one intake block per gap with these fields.

### `area_anchor`

Format:

`"<Business> — <plain English description of the opportunity or problem>"`

Rules:
- Plain business language only — no code paths, function names, schema names, or system-internal terms
- Describe the business outcome affected, not the technical component broken
- Must make sense to someone who has never seen the codebase
- A 14-year-old should be able to read this and know roughly what the problem is
- Target ≤15 words
- Use an em dash (—) not a hyphen

Good:
- `Brikette — Guest emails with two questions only get one answer`
- `XA — New arrivals look the same as everything else in mixed listings`
- `PWRB — No pilot locations have been identified to test with real customers`

Bad (technical, no business context):
- `BRIK email pipeline — intent extraction collapses clause-level questions`
- `XA xa-b product cards — missing New In badge`
- `BRIK gmail pipeline — In-Progress recovery not auto-scheduled`

### `location_anchors`

Use the Question 4 answer as-is after splitting into a list. At least one entry is required
for `fact_find_ready` and `micro_build_ready` paths.

### `evidence_refs`

Always include, in this order:
1. `operator-stated: <gap clause>`
2. each `location_anchor`
3. any structured evidence references the operator supplied (`repro_ref`, `risk_ref`, named doc/log references)
4. any engineering coverage hints as `coverage-hint: <label>`

### `current_truth`

Prefer a one-sentence compression of the opening description plus the gap clause. Keep it
operator-meaningful rather than schema-shaped.

Fallback:

`"<area label> currently has this gap for <business>: <gap clause>."`

### `next_scope_now`

Use a route-neutral default before Step 4 decides the actual path.

Fallback:

`"Assess <area_anchor> for <business> and determine the next executable step."`

### `why`

Write 2–3 plain sentences at a 14-year-old reading level. No jargon, no code paths, no technical system names.

Structure:
1. What is happening now that is a problem (described in business terms — what staff, customers, or the business experiences)
2. The real-world consequence (what gets missed, delayed, broken, or lost)
3. What specifically gets better when this is fixed (the benefit to the business)

Rules:
- Never name a code function, file path, schema, or internal tool
- If you must reference something technical, describe what it does for the user, not its name
- Avoid passive voice where possible
- Keep sentences short

Good example:
> "When a guest asks two things in one email, the AI sometimes only answers the main question and ignores the rest. The guest then either waits for a follow-up or thinks we ignored part of their message. Fixing this ensures every question gets a proper answer, every time."

Bad example (technical, no consequence stated):
> "Mixed-intent guest emails currently collapse to a single dominant answer path. The extraction layer must atomize compound clauses before scenario ranking."

Fallback if no information is available:

`"This affects how <business> handles <plain description of the affected area>. Without this fix, <plain description of the consequence>. Resolving it would <plain description of the benefit>."`

### `intended_outcome`

If the operator explicitly states the desired end state, preserve it with `source: operator`.

Otherwise use:
- `type: operational`
- `statement: "A validated next action exists for <area_anchor>, with required evidence captured."`
- `source: auto`

## Handoff Back to Step 4

When the intake block is complete:
- return to `SKILL.md` Step 4
- apply routing intelligence using the structured answers
- ask extra follow-up questions only if Step 4 is genuinely ambiguous after the structured intake

## Worked Examples

### Example A - Missing document / research gap

- `business`: `BRIK`
- `gap count`: `one`
- `area label`: `hostel pricing playbook`
- `location_anchors`:
  - `docs/business-os/strategy/BRIK/`
  - `pricing workflow`
- `gap shape`: `no canonical pricing playbook exists | SELL | business-artifact`

Resulting `area_anchor`:
- `BRIK hostel pricing playbook - no canonical pricing playbook exists`

### Example B - Incident / broken behavior

- `business`: `BRIK`
- `gap count`: `one`
- `area label`: `payment retry path`
- `location_anchors`:
  - `apps/reception/src/app/api/payments/retry/route.ts`
  - `payment webhook retries`
- `gap shape`: `payment retry path fails silently | SELL | code-change`
- `incident_id`: `INC-2026-03-09-01`
- `repro_ref`: `payments log 2026-03-09`

### Example C - Measurement gap

- `business`: `BRIK`
- `gap count`: `one`
- `area label`: `checkout tracking`
- `location_anchors`:
  - `/checkout`
  - `confirmation page`
- `gap shape`: `no confirmation metric baseline | SELL | code-change`
- `metric prompt`: `confirmation | purchase_rate | 0.018`
