# LLM-Driven vs Deterministic Classification: lp-do-ideas and lp-do-build

Analysis of which phases/steps in the feature-workflow completion sequence require LLM judgment vs could be deterministic.

---

## Executive Summary

| Component | Current Mode | High-Confidence Candidates for Determinism |
|-----------|-------------|------------------------------------------|
| **lp-do-ideas** | Mostly LLM (core routing) | Evidence gathering, area_anchor formatting |
| **lp-do-build Plan Completion** | Mixed (LLM + scripts) | Ideas extraction, pattern reflection, build-event emission |
| **Post-build Results Review** | Mostly LLM | New Idea Candidates scan, Standing Updates check |

**Token cost context:**
- `lp-do-ideas` routing judgment: 2–4 API calls per operator intake (medium cost)
- `lp-do-build` results-review generation: 1 major LLM call (high cost, 5–10k context)
- `lp-do-build` idea extraction from results-review: deterministic regex/scan (zero cost)

---

## lp-do-ideas — Intake Path (SKILL.md Steps 1–4)

### Step 1: Gather the idea
| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Free-text input collection** | LLM convo | LLM_REQUIRED | Low | Open-ended operator description; no deterministic input shape |

### Step 2: Determine trigger type
| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Classify artifact_delta vs operator_idea** | LLM (ask "has this been written?" if unclear) | LLM_REQUIRED | Low | SKILL.md Step 2: "if unclear, ask one question." This is genuine judgment — needs language understanding to disambiguate context |

### Step 3: Gather minimum context
| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Business selection** | LLM (infer or ask) | LLM_BUT_TEMPLATABLE | Low | For `artifact_delta`: must select from standing registry (deterministic list). For `operator_idea`: infer from context or single-question fallback. Templateable: ask "Which business: HBAG / HEAD / BRIK / PWRB?" |
| **artifact identification** | LLM (show list from registry) | DETERMINISTIC_NOW | Zero | SKILL.md: "show list from standing registry if needed." Registry is a JSON file; enumerate it deterministically. |
| **changed_sections inference** | LLM (if SHAs unavailable) | LLM_REQUIRED | Medium | User describes change in prose; agent must extract section headings. Possible future: diff-based `git show` automation, but requires SHA inputs. Currently no deterministic fallback. |
| **Area anchor formation (operator_idea)** | LLM (format rule: ≤12 words, no prose) | LLM_BUT_TEMPLATABLE | Low | SKILL.md rules: "Business Artifact — gap in one clause." Enforces format constraints, not discovery. Could be: ask 5 structured questions (area?, gap type?, domain?) → assemble template. |
| **Domain selection** | LLM (infer; confirm if ambiguous) | LLM_BUT_TEMPLATABLE | Low | Controlled enum: `MARKET | SELL | PRODUCTS | LOGISTICS | STRATEGY`. Templateable: show enum + 2–3 example area anchors per domain, let operator pick. |
| **Evidence field gathering** | LLM (listen for signals) | LLM_BUT_TEMPLATABLE | Low | SKILL.md Table in Step 3: 9 evidence fields (incident_id, deadline_date, repro_ref, etc.). Templateable: ask targeted questions per field ("Any incidents? Any deadlines? Estimated cost?") instead of relying on free-text parsing. |

### Step 4: Apply routing intelligence
| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Route decision: fact_find_ready vs briefing_ready vs logged_no_action** | **LLM (3-question framework)** | **LLM_REQUIRED** | **Medium** | **Core routing judgment (SKILL.md "Routing Intelligence" section).** Three explicit questions: (1) Is change material? (2) Does it open a planning gap? (3) Is area already covered? All require language understanding + codebase/plan context checking. No keyword list works — judgment is genuinely needed. |
| **Admin non-idea suppression** | LLM (test: "does operator do or need to know?") | LLM_REQUIRED | Medium | SKILL.md admin suppression: "Does this describe something the operator does, or needs to know?" Genuinely ambiguous cases that require context + judgment. Examples provided but not an exhaustive keyword list. |
| **Dispatch packet schema validation** | TS script (`lp-do-ideas-routing-adapter.ts`) | DETERMINISTIC_NOW | Zero | Routing adapter validates completeness and produces typed invocation payloads. Already implemented. |
| **Queue persistence** | TS script (`lp-do-ideas-trial-queue.ts`) | DETERMINISTIC_NOW | Zero | Persists to `queue-state.json`, deduplicates by event hash. Already implemented. |

---

## lp-do-ideas — Structured Invocation (Programmatic)

### artifact_delta routing
| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **T1_SEMANTIC_KEYWORDS matching** | TS script (`lp-do-ideas-trial.ts` line 27–68) | DETERMINISTIC_NOW | Zero | Case-insensitive substring match on section content. Hardcoded keyword list for `artifact_delta` triggers only. For `operator_idea` triggers, **keywords are NOT used** — agent applies judgment instead (per SKILL.md). |
| **changed_sections classification** | TS script + LLM (classifier in `lp-do-ideas-classifier.ts`) | MIXED | Medium | If changed_sections present: TS extracts fingerprint (`lp-do-ideas-fingerprint.ts`), then calls `classifyIdea()` (deterministic decision tree, not LLM). Classifier uses 9 reason codes (RULE_LEGAL_EXPOSURE, RULE_P1_DIRECT_CAUSAL, etc.) — fully deterministic. |

---

## lp-do-build — Plan Completion and Archiving (Steps 1–8)

### Step 1: Produce build-record.user.md

| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Outcome Contract population** | **LLM (manual craft during build)** | **LLM_REQUIRED** | **Medium** | Fields: Why, Intended Outcome Type, Intended Outcome Statement, Source. Captured during task execution (not automated). `lp-do-build-event-emitter.ts` reads and validates. |
| **TBD/auto fallback application** | LLM (judgment call) | LLM_BUT_TEMPLATABLE | Low | SKILL.md: "use explicit TBD/auto fallback only when canonical values unavailable." Templateable: define fallback rules per field (e.g., Source → "operator" | "auto" | "TBD"). |

### Step 1.5: Emit build-event.json

| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Extract and serialize from build-record** | TS script (`lp-do-build-event-emitter.ts`) | DETERMINISTIC_NOW | Zero | Reads `## Outcome Contract` section, maps fields, validates presence, writes JSON. Fully implemented. |

### Step 2: Produce results-review.user.md (Part A — codemoot route)

| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Invoke codemoot (external LLM)** | External LLM (codemoot CLI) | LLM_REQUIRED | **High** | SKILL.md Step 2 codemoot route: delegates to external LLM process. Context: plan.md + build-record.user.md (~5–10k tokens). Returns pre-filled results-review. Codemoot unavailability falls back to inline. |
| **Template application** | Codemoot (scripted) | LLM_BUT_TEMPLATABLE | Medium | Codemoot receives hardcoded section list: Observed Outcomes, Standing Updates, New Idea Candidates, Standing Expansion, Intended Outcome Check. Template is provided at task invocation. |

### Step 2: Produce results-review.user.md (Part B — inline fallback)

| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Scan for New Idea Candidates signals** | **LLM (5-category regex + judgment)** | **LLM_BUT_SCRIPTABLE** | **Medium** | SKILL.md 2.0 lists 5 signal categories: (1) new data source, (2) new OSS package, (3) new skill, (4) new loop process, (5) AI-to-mechanistic. Current: agent scans build context (plan, logs, test results) and applies judgment. **Could be script:** search for keywords + diff patterns (e.g., `import { newPackage }`, `new endpoint`, `// TODO: automate`). Confidence: 60–70% (misses nuance, catches patterns). |
| **Standing Updates extraction** | LLM (diff plan vs built artifact) | LLM_BUT_SCRIPTABLE | Medium | SKILL.md 2.0: "Layer A standing artifact path: required update summary." Current: agent reads build context and recommends updates to standing artifacts. **Could be script:** flag all files touched in `Affects` that match `docs/business-os/startup-loop/` paths; suggest "standing artifact X is affected by changes to [files], review for update." Confidence: 80% (structure-aware, misses semantic updates). |
| **Intended Outcome Check** | LLM (compare intended vs observed) | LLM_REQUIRED | Medium | SKILL.md template section: "Verdict: Met | Partially Met | Not Met." Requires reading build-record intended outcome, cross-referencing test results/rollout data, and issuing judgment. No deterministic signal exists pre-build. |

### Step 2.5: Produce pattern-reflection.user.md

| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Extract patterns from New Idea Candidates** | **LLM (scan + classify recurrence)** | **LLM_BUT_SCRIPTABLE** | **Medium** | SKILL.md 2.5: for each entry in `## New Idea Candidates`, classify as: repeatable rule, recurring opportunity, or access gap. Also count historical recurrences. **Could be script:** (1) parse results-review ideas from JSON. (2) Query historical plans for similar idea_key patterns (grep in `_archive/*/results-review.user.md`). (3) Count matches. (4) Template: "Idea X observed 3 times in past 4 months → repeatable rule." Confidence: 90% (structure-aware, low ambiguity). |
| **Pattern-reflection artifact creation** | TS + LLM (mixed) | LLM_BUT_SCRIPTABLE | Low | Schema-driven: `docs/plans/startup-loop-build-reflection-gate/task-01-schema-spec.md` defines format (≤100 char summary, category, routing result, count). Template-fillable. |

### Step 2.6: Self-evolving bridge (advisory)

| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Run observation ingestion** | TS script + optional external signal bridge | DETERMINISTIC_NOW | Zero | `pnpm startup-loop:self-evolving-from-build-output`. Fail-open advisory; non-blocking. |

### Step 3: Reflection debt emission

| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Validate results-review for missing sections** | TS script (`lp-do-build-reflection-debt.ts`) | DETERMINISTIC_NOW | Zero | Checks `REQUIRED_REFLECTION_SECTIONS` enum. Emits debt if sections are missing/empty. Schema-driven. |
| **Generate reflection-debt.user.html** | LLM (optional; template-driven) | LLM_BUT_TEMPLATABLE | Low | Only emitted if debt exists. Template at `docs/templates/visual/loop-output-report-template.html`. Plain-language plain-text → HTML bridge (low token cost). |

### Step 4: Bug scan

| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Run bug scan** | External script (`pnpm bug-scan`) | DETERMINISTIC_NOW | Zero | Emits `bug-scan-findings.user.json`. Non-LLM code-analysis tool. |

### Step 5: Process improvements generation

| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Generate HTML report** | TS script (`generate-process-improvements.ts`) | DETERMINISTIC_NOW | Zero | Reads `docs/business-os/_data/process-improvements.json`, renders to HTML. Updates `docs/business-os/process-improvements.user.html`. |

### Step 6: Completed ideas registry

| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Append completed idea entry** | TS function (`appendCompletedIdea()` in `generate-process-improvements.ts`) | DETERMINISTIC_NOW | Zero | Writes to `docs/business-os/_data/completed-ideas.json`. Schema-driven. |

### Step 7: Plan archiving

| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Set Status: Archived, move plan** | TS + git (per `plan-archiving.md`) | DETERMINISTIC_NOW | Zero | Moves plan from `docs/plans/<slug>/` to `docs/plans/_archive/<slug>/`. |

### Step 7.5: Queue-state completion hook

| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Mark dispatch completed** | TS script (`markDispatchesCompleted()` in `lp-do-ideas-queue-state-completion.ts`) | DETERMINISTIC_NOW | Zero | Idempotent mutation of `queue-state.json`. Feature slug + outcome one-liner. |

### Step 8: Commit post-build artifacts

| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Writer lock + git commit** | Bash script (`with-writer-lock.sh`) | DETERMINISTIC_NOW | Zero | Acquires lock, stages files, commits. |

---

## lp-do-build — Post-Build Validation (build-validate.md)

### Mode Selection

| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Select Mode 1, 2, or 3 by Deliverable-Type** | TS enum match | DETERMINISTIC_NOW | Zero | Looks up task `Deliverable-Type` in fixed table. No judgment. |

### Mode 1: Visual Walkthrough

| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Navigate and screenshot** | Browser session (MCP tool) | DETERMINISTIC_NOW | Zero | Automated browser actions per acceptance criteria. |
| **Run scoped UI audits** | Skill invocations (`/lp-design-qa`, `/tools-ui-contrast-sweep`, `/tools-ui-breakpoint-sweep`) | **LLM + tooling (audit scope + remediation judgment)** | **Medium** | Scoping is deterministic (list `Affects` routes). Remediation (auto-fix list for Critical/Major) is LLM. |
| **Fix+Retry loop** | LLM (root-cause analysis + min fix set) | LLM_REQUIRED | Medium | SKILL.md: "Identify root cause before applying fix." Requires judgment to distinguish symptom patch from true root cause. |

### Mode 2: Data Simulation

| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Construct test inputs** | LLM (infer from acceptance criteria) | LLM_BUT_TEMPLATABLE | Low | SKILL.md: "happy path + edge case." Templateable: read `Acceptance Criteria` section, extract required inputs, generate representatives. |
| **Execute and compare** | Bash + diff | DETERMINISTIC_NOW | Zero | Run function/API call, capture output, diff vs expected. |

### Mode 3: Document Review

| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Read linearly + checklist** | Human/LLM (semantic review) | LLM_REQUIRED | Medium | Check for broken refs, inconsistencies, missing sections. Requires understanding of document semantics. Could script some checks (broken anchors, orphaned TODOs) but not all. |

---

## Build-Time Ideas Hook

| Phase | Current | Classification | Token Cost | Notes |
|-------|---------|-----------------|-----------|-------|
| **Run TS build-commit hook** | TS script (`lp-do-ideas-build-commit-hook.ts`) | DETERMINISTIC_NOW | Zero | Compares HEAD~1 to HEAD, filters `Affects` files by standing-registry membership, emits dispatch candidates if semantic keywords detected. Fail-open advisory. |
| **Log candidates to build evidence** | LLM or script | LLM_BUT_TEMPLATABLE | Low | If candidates emitted, record them for operator review. Templateable: "New idea candidate [title] detected (trigger: [changed section]). Review in results-review.". |

---

## Summary Table: Token Cost Breakdown

| Component | LLM_REQUIRED | LLM_BUT_SCRIPTABLE | LLM_BUT_TEMPLATABLE | DETERMINISTIC_NOW |
|-----------|------------|--------|----------|-----------|
| **lp-do-ideas Intake** | Trigger type (Step 2), Route decision (Step 4), Admin suppression | — | Business select, Area anchor, Domain select, Evidence gathering | Registry enum, Schema validation, Queue persistence |
| **lp-do-build Plan Completion** | Outcome Contract (manual), Intended Outcome Check, Fix+Retry | New Idea Candidates scan, Standing Updates, Pattern reflection | TBD fallback rules, Reflection debt HTML | Build-record emission, Results-review template, Process improvements, Bug scan, Archive, Queue hook |
| **Post-Build Validation (Mode 1)** | Audit remediation judgment, Root-cause analysis, Fix+Retry | — | Test input generation | Mode selection, Browser automation, Audit scope |
| **Post-Build Validation (Mode 3)** | Document semantic review | Broken anchor detection | — | — |

---

## Token Cost Estimate (Monthly Baseline)

**Assumptions:**
- 4 feature builds per business per month (16 total)
- 4 operator ideas per business per month (16 total)

| Phase | Frequency | Calls/Month | Tokens/Call | Total Tokens | Cost Tier |
|-------|-----------|------------|------------|-----------|-----------|
| **lp-do-ideas operator intake** (Step 2–4 routing) | 4/biz/mo | 16 calls | 2–4k (medium context) | 32–64k | **Medium** |
| **lp-do-build results-review (codemoot)** | 4/biz/mo | 16 calls | 5–10k (build + plan context) | 80–160k | **High** |
| **lp-do-build results-review (inline fallback)** | 4/biz/mo | 16 calls | 3–8k (scan + synthesis) | 48–128k | **High** |
| **Mode 1 audit remediation** | 4/biz/mo | 16 calls | 2–5k (screenshot + findings) | 32–80k | **Medium** |
| **Subtotal per month** | — | — | — | **192–432k tokens** | — |

**Opportunities for reduction (high confidence):**
1. **Templatize lp-do-ideas operator intake** (5–6 structured questions replacing free-text routing): **−50% of intake calls** (~16–32k tokens saved)
2. **Automate New Idea Candidates scanning** (deterministic keyword + diff analysis + template fill): **−40–60% of results-review generation** (~32–96k tokens saved, use codemoot for remaining synthesis)
3. **Automate pattern-reflection extraction** (historical plan scanning + count): **−80% of pattern-reflection work** (~12–20k tokens saved)

**Conservative total after optimizations:** ~100–200k tokens/month (50% reduction).

---

## Recommended Prioritization for Determinism Conversion

### Tier 1 (High ROI, Low Risk)
1. **New Idea Candidates scanning** — currently medium-cost LLM work, 90% automatable via keyword + diff patterns.
2. **Pattern-reflection generation** — recurrence counting + template fill. Low ambiguity.
3. **lp-do-ideas operator intake templating** — replace free-text routing judgment with 5 structured questions per operator idea.

### Tier 2 (Medium ROI, Medium Risk)
4. **Standing Updates detection** — file-touched + standing-registry intersection, with semantic update suggestions.
5. **Evidence field gathering** — replace listen-for-signals with targeted questions (incident? deadline? cost estimate?).

### Tier 3 (Lower ROI, Higher Ambiguity)
6. **Audit remediation judgment** — auto-fix list for Critical/Major findings. Confidence 70%; requires root-cause detection.
7. **Mode 2 test input generation** — infer from acceptance criteria. Confidence 80%; edge cases require judgment.

---

## References

- **lp-do-ideas SKILL:** `.claude/skills/lp-do-ideas/SKILL.md`
- **lp-do-build SKILL:** `.claude/skills/lp-do-build/SKILL.md`
- **build-validate module:** `.claude/skills/lp-do-build/modules/build-validate.md`
- **Classifier (deterministic):** `scripts/src/startup-loop/ideas/lp-do-ideas-classifier.ts`
- **Routing adapter:** `scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts`
- **Build event emitter:** `scripts/src/startup-loop/build/lp-do-build-event-emitter.ts`
- **Reflection debt:** `scripts/src/startup-loop/build/lp-do-build-reflection-debt.ts`
