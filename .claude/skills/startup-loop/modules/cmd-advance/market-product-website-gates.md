# `cmd-advance` — Market / Product / Website Gates

## Market / Product / Website Gate Family

Load this module when the current transition touches MARKET-06, PRODUCT-02, or WEBSITE->DO handoff.

### GATE-BD-03: Messaging Hierarchy required at MARKET-06 Done

**Gate ID**: GATE-BD-03 (Hard)
**Trigger**: MARKET-06 completion check — MARKET-06 is not Done until both offer artifact AND messaging-hierarchy.user.md (Draft minimum) exist.

**Rule**: Check Messaging Hierarchy Status column in index.user.md. Default to blocked (fail-closed) if Status cannot be parsed.

```bash
grep "Messaging Hierarchy" docs/business-os/strategy/<BIZ>/index.user.md | grep -E "Draft|Active"
```

**When blocked**:
- Blocking reason: `GATE-BD-03: Messaging Hierarchy missing or not at Draft minimum. MARKET-06 is not Done until messaging-hierarchy.user.md exists.`
- Next action: `Create messaging-hierarchy.user.md at Draft minimum using BRAND-DR-03/04 prompts, then update index.user.md Status to Draft.`

---

### GATE-PRODUCT-02-01: Adjacent product research advisory (PRODUCT container) at MARKET-06 Done

**Gate ID**: GATE-PRODUCT-02-01 (Soft — advisory, does not block advance)
**Trigger**: MARKET-06 completion check — evaluated when MARKET-06 is Done and intake packet has `growth_intent` referencing product range expansion, or operator manually invokes. Stage is `PRODUCT-02` and belongs to the PRODUCT container.

**Rule**: Check whether `lp-other-products-prompt.md` exists under `docs/business-os/strategy/<BIZ>/`.

```bash
ls docs/business-os/strategy/<BIZ>/lp-other-products-prompt.md 2>/dev/null
```

**When triggered** (MARKET-06 Done + condition met + prompt absent):
- Advisory: `GATE-PRODUCT-02-01: Growth intent references product range expansion. Run /lp-other-products <BIZ> to generate the adjacent product research prompt, then drop it into a deep research tool (OpenAI Deep Research or equivalent). Save results to docs/business-os/strategy/<BIZ>/lp-other-products-results.user.md so S4 baseline merge can include them as optional context.`
- Does NOT block SIGNALS-01/SELL-01 fan-out or S4 join barrier.

**When skipped**: Condition not met (growth_intent absent or does not reference product range expansion), OR prompt already exists.

---

### GATE-WEBSITE-DO-01: WEBSITE-01 Active handover to DO fact-find

**Gate ID**: GATE-WEBSITE-DO-01 (Hard)
**Trigger**: Before advancing from `WEBSITE` container to `DO` when `launch-surface=pre-website`.

**Rule**: WEBSITE-01 is not considered handoff-complete until its active first-build contract has been converted into a DO fact-find artifact.

**Check (filesystem-only):**

```bash
# Check 1: WEBSITE-01 first-build contract is Active
grep -l "Status: Active" docs/business-os/strategy/<BIZ>/site-v1-builder-prompt.user.md 2>/dev/null

# Check 2: strategy index row is also Active (authoritative gate row)
grep "Site V1 Builder Prompt" docs/business-os/strategy/<BIZ>/index.user.md | grep "Active"

# Check 3: DO handover fact-find exists and is ready
grep -l "Status: Ready-for-planning" docs/plans/<biz>-website-v1-first-build/fact-find.md 2>/dev/null
```

**Decision table:**

| WEBSITE-01 contract status | WEBSITE first-build fact-find status | Gate result | Action |
|---|---|---|---|
| Missing or `Draft` | — | `blocked` | Run WEBSITE-01 prompt handoff first |
| `Active` | Missing or not `Ready-for-planning` | `blocked` | Dispatch `/lp-do-fact-find` with WEBSITE first-build alias |
| `Active` | `Ready-for-planning` | `pass` | Continue DO progression (`/lp-do-plan`), then `/lp-do-build` only after `plan.md` is `Status: Active` |

**When blocked (WEBSITE-01 missing/draft):**
- `blocking_reason`: `GATE-WEBSITE-DO-01: WEBSITE-01 first-build contract is not Active. DO handover requires an active site-v1-builder-prompt artifact.`
- `next_action`: `Run docs/business-os/workflow-prompts/_templates/website-first-build-framework-prompt.md and save docs/business-os/strategy/<BIZ>/site-v1-builder-prompt.user.md with Status: Active, then re-run /startup-loop advance --business <BIZ>.`

**When blocked (needs DO fact-find handover):**
- `blocking_reason`: `GATE-WEBSITE-DO-01: WEBSITE-01 is Active but DO fact-find handover has not been executed.`
- `next_action`: `Run /lp-do-fact-find --website-first-build-backlog --biz <BIZ> --feature-slug <biz>-website-v1-first-build --source docs/business-os/strategy/<BIZ>/site-v1-builder-prompt.user.md, then re-run /startup-loop advance --business <BIZ>.`
- `required_output_path`: `docs/plans/<biz>-website-v1-first-build/fact-find.md`

**Pass contract note:**
- Passing this gate authorizes DO planning entry (`/lp-do-plan`) only.
- `/lp-do-build` remains blocked until `docs/plans/<biz>-website-v1-first-build/plan.md` exists and is `Status: Active`.
