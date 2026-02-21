---
Type: Investigation Artifact
Task: TASK-01
Plan: startup-loop-orchestrated-os-comparison-v2
Status: Complete
Created: 2026-02-18
Sources:
  - docs/business-os/startup-loop/process-registry-v1.md
  - docs/briefs/orchestrated-business-startup-loop-operating-system-research.md
  - docs/business-os/startup-loop/stage-operator-dictionary.yaml
  - docs/plans/startup-loop-orchestrated-os-comparison-v2/fact-find.md
---

# v2 Vocabulary and Assignment Baseline

Canonical reference artifact for TASK-02 (taxonomy contract) and TASK-03 (process assignment matrix). All findings are derived from read-only evidence scans across the four source documents listed above.

---

## 1. Canonical 7-Workstream ID/Name Set

These are the authoritative workstream identifiers and names per the research brief. The v1 registry uses slightly different section-heading names in four workstreams (see §5 for name discrepancies).

| Workstream ID | Canonical Name | Process Count |
|---|---|---|
| CDI | Customer Discovery and Market Intelligence | 4 |
| OFF | Offering and Pricing | 4 |
| GTM | Go-to-Market and Growth | 4 |
| OPS | Operations and Tooling | 4 |
| CX | Customer Experience and Retention | 4 |
| FIN | Finance and Sustainability | 4 |
| DATA | Data Capture and Continuous Improvement | 4 |

**Total: 7 workstreams, 28 processes (4 per workstream).**

---

## 2. Canonical Workflow Phase List (Ordered)

These are the 7 workflow phases within the weekly operating cycle, in execution order.

| Order | Phase ID | Phase Name | Description |
|---|---|---|---|
| 1 | Sense | Sense and Diagnose | Pull KPI pack, review leading indicators, scan signals — weekly orientation. |
| 2 | Decide/Plan | Decide and Plan | Weekly priorities set, budgets allocated, capacity committed, experiment backlog updated. |
| 3 | Build/Prepare | Build and Prepare | Execute content, SOPs, listing updates, maintenance schedules — capability preparation. |
| 4 | Sell/Acquire | Sell and Acquire Demand | Run campaigns, operate channels, manage sales pipeline, execute retention outreach. |
| 5 | Deliver/Support | Deliver and Support | Fulfil orders/stays, triage support, process returns, perform QA. |
| 6 | Measure/Learn | Measure and Learn | Review results, run post-mortems, cohort analysis, billing reconciliation. |
| 7 | Weekly Review | Weekly Review | DATA-4 facilitation: cross-workstream KPC review, decision log, next-cycle intent. |

**Research brief aliases**: `Workflow (Main Loop)` = `Workflow`; `weekly_states` keys (Sense, Plan, Execute, Deliver, Measure, Weekly_Review) correspond to the 7 phases above.

---

## 3. Vocabulary Glossary and Alias Policy

### 3.1 Term Definitions

| Term | Status | Concept | Recommended v2 Usage |
|---|---|---|---|
| **Workstream** | Canonical | A business-function group of related processes with the same functional purpose (e.g., CDI, OFF). | Use exclusively for process grouping in v2. |
| **Workflow** | Canonical | The end-to-end repeating weekly operating cycle; the sum of all workstreams and phases. | Use for the top-level cycle container. |
| **Workflow Phase** | Canonical | A named step within the weekly Workflow cycle (one of the 7 phases above). | Use as the machine-readable field name in YAML. |
| **Stage** | Canonical | A node in the startup-loop stage graph (S0–S10 + sub-stages). Governs build sequence, gates, and entry/exit criteria. Entirely separate from Workstreams and Workflow Phases. | Use exclusively for stage-graph context; never conflate with Workflow Phase. |
| **Domain** _(section heading)_ | Legacy alias → Workstream | Process-grouping label used as section headings in process-registry-v1.md (e.g., `## Domain: CDI`). Same concept as Workstream. | Replace with `Workstream:` in v2 registry sections per TASK-04. |
| **Domain** _(frontmatter field)_ | Ambiguous — evaluate separately | Higher-level classification (e.g., `Domain: Venture-Studio`, `Domain: Business-OS`) in plan/registry frontmatter. A different concept from the section-heading Domain. | Do not rename as part of this v2 wave without a separate decision. |
| **Lane** | Not used | Not present in any source file. Appeared only as descriptive gloss in fact-find ("business-function lane"). | Do not introduce. If encountered informally, redirect to `Workstream`. |

### 3.2 Legacy → Canonical Mapping Table

| Legacy Term | Context | Canonical Replacement | Migration Action |
|---|---|---|---|
| `Domain:` (section heading) | process-registry-v1.md section headings | `Workstream:` | TASK-04: replace section heading prefix |
| `Domain` (column header) | process-registry-v1.md Quick Reference Index | `Workstream` | TASK-04: rename column header |
| `Go-to-Market and Distribution` | v1 GTM section name | `Go-to-Market and Growth` | TASK-04: update section name |
| `Delivery Operations` | v1 OPS section name | `Operations and Tooling` | TASK-04: update section name |
| `Customer / Guest Experience and Support` | v1 CX section name | `Customer Experience and Retention` | TASK-04: update section name |
| `Finance and Risk / Compliance` | v1 FIN section name | `Finance and Sustainability` | TASK-04: update section name |
| `Data and Measurement` | v1 DATA section name | `Data Capture and Continuous Improvement` | TASK-04: update section name |
| `weekly_states` (YAML key) | research brief YAML pseudo-spec | `workflow_phases` | Document alias in taxonomy; no file edit required (research brief is read-only) |

### 3.3 Alias Policy

- Any file using `Domain:` as a process-grouping section heading must be updated to `Workstream:` in the v2 refactor.
- The frontmatter `Domain` field (used for venture-studio / BOS classification) is **explicitly out of scope** for this rename wave. It refers to a different concept; renaming it requires a separate decision.
- `Lane` has no registered meaning. Any informal use in operator notes should be redirected to `Workstream` on next contact.
- Legacy term aliases that are retained for compatibility must be marked with a `# legacy alias for: <canonical>` note.

---

## 4. Full 28-Row Process Mapping Draft

Columns: `process_id` | `process_name` | `canonical_workstream_id` | `workflow_phases` | `primary_workflow_phase` | `activation` | `activation_condition`

| process_id | process_name | workstream | workflow_phases | primary_phase | activation | activation_condition |
|---|---|---|---|---|---|---|
| CDI-1 | Weekly Signal Intake and Insight Synthesis | CDI | Sense, Decide/Plan | Sense | always | — |
| CDI-2 | Customer Development Interviews and Field Validation | CDI | Sense, Decide/Plan | Sense | conditional | Weekly pre-PMF; biweekly at PMF/scaling; mandatory when top assumptions unvalidated |
| CDI-3 | Market and Competitor Scan | CDI | Sense, Decide/Plan | Sense | conditional | Weekly in high season or wholesale-heavy; biweekly/monthly for digital-only; mandatory during Demand Shock exception |
| CDI-4 | Experiment Backlog Design and Prioritisation | CDI | Decide/Plan, Measure/Learn | Decide/Plan | always | — |
| OFF-1 | Offer and Value Proposition Iteration | OFF | Decide/Plan, Build/Prepare | Decide/Plan | always | — |
| OFF-2 | Pricing and Revenue Management Review | OFF | Decide/Plan, Sell/Acquire | Decide/Plan | conditional | Always weekly for hospitality; product: only on price-sensitivity flag or Demand Shock exception |
| OFF-3 | Product / Listing Content and Merchandising Refresh | OFF | Build/Prepare | Build/Prepare | always | — |
| OFF-4 | Channel Policy and Conflict Management | OFF | Decide/Plan | Decide/Plan | conditional | Mandatory for wholesale_heavy / OTA_mix_high; monthly for all; weekly only on exception |
| GTM-1 | Weekly Demand Plan and Campaign Sprint | GTM | Decide/Plan, Sell/Acquire | Decide/Plan | always | — |
| GTM-2 | Distribution Channel Ops (Retail/Wholesale/OTAs) | GTM | Sell/Acquire | Sell/Acquire | conditional | Mandatory for wholesale_heavy, OTA_mix_high, hospitality; daily cadence in high season |
| GTM-3 | Sales / Account Pipeline and Booking Deals | GTM | Sell/Acquire | Sell/Acquire | conditional | Mandatory when wholesale_accounts > 0; activates at CAP-05 gate |
| GTM-4 | Conversion and Lifecycle Automation | GTM | Sell/Acquire, Measure/Learn | Sell/Acquire | conditional | Post-launch only; activates at CAP-06 gate when first transaction data available |
| OPS-1 | Capacity and Inventory Planning | OPS | Decide/Plan, Deliver/Support | Decide/Plan | conditional | Mandatory for inventory_present and hospitality; optional for pure digital-only |
| OPS-2 | Fulfilment or Stay Delivery Execution | OPS | Deliver/Support | Deliver/Support | conditional | Activates post-S9 launch; mandatory for inventory_present / hospitality |
| OPS-3 | Returns, Refunds, Cancellations and Chargebacks | OPS | Deliver/Support, Measure/Learn | Deliver/Support | conditional | Activates after first transactions; mandatory for returns_enabled / hospitality |
| OPS-4 | Quality Assurance and Maintenance Management | OPS | Deliver/Support, Build/Prepare | Deliver/Support | conditional | Mandatory for inventory_present / hospitality; safety-critical issues trigger Compliance/Safety Incident exception |
| CX-1 | Support Triage and Service Recovery | CX | Deliver/Support, Measure/Learn | Deliver/Support | always | — |
| CX-2 | Reviews and Reputation Management | CX | Deliver/Support, Measure/Learn | Measure/Learn | conditional | Mandatory for hospitality / OTA_mix_high; activates from first review received |
| CX-3 | Retention and Loyalty Loops | CX | Sell/Acquire, Measure/Learn | Sell/Acquire | conditional | PMF+ only; activates at CAP-06 gate; OFF-4 channel conflict compliance required |
| CX-4 | SOP and Training Updates | CX | Build/Prepare | Build/Prepare | always | — |
| FIN-1 | Weekly Cash and Unit Economics Review | FIN | Sense, Decide/Plan | Sense | always | — |
| FIN-2 | Billing, Payouts and Reconciliation | FIN | Measure/Learn | Measure/Learn | conditional | Activates after first transactions; mandatory for wholesale_heavy / hospitality / any payment processor |
| FIN-3 | Risk Register, Compliance, and Incident Readiness | FIN | Sense, Weekly Review | Sense | always | — |
| FIN-4 | Vendor and Procurement Management | FIN | Decide/Plan | Decide/Plan | conditional | Mandatory for hospitality / inventory_present; monthly review; weekly only on exception; activates post-S5B |
| DATA-1 | KPI Refresh and Data Integrity Checks | DATA | Sense | Sense | always | — |
| DATA-2 | Leading Indicator Monitoring and Alerting | DATA | Sense | Sense | always | — |
| DATA-3 | Incident Post-Mortems and Corrective Actions | DATA | Measure/Learn | Measure/Learn | exception_only | Triggered by exception state resolution or DATA-2 alert at severity >= threshold; required for Quality Incident / Compliance/Safety Incident / material Cash Constraint |
| DATA-4 | Weekly Review Facilitation and Decision Log | DATA | Weekly Review | Weekly Review | always | — |

**Coverage**: 28/28 processes. 0 contested. All mappings clear.

---

## 5. Known Ambiguity List

These are the most likely contested or clarification-required items for TASK-02/TASK-03 reviewers.

### 5.1 Domain Frontmatter Overload (High Priority)
The word `Domain` is used for **two distinct concepts** in the current codebase:
1. **Process-grouping heading** (`## Domain: CDI`) in process-registry-v1.md → maps to `Workstream` in v2.
2. **Higher-level classification** (`Domain: Venture-Studio`, `Domain: Business-OS`) in plan and registry frontmatter → a separate concept with no v2 canonical name yet.

The v2 rename targets (1) only. If (2) is also renamed, scope must be explicitly expanded via a TASK-00 amendment.

### 5.2 Workstream Name Mismatches (4 workstreams)
The v1 registry uses different long-form names for 4 workstreams. These are purely naming differences — process ID prefixes are already canonical:

| Workstream | v1 Registry Name | Research Canonical Name |
|---|---|---|
| GTM | Go-to-Market and Distribution | Go-to-Market and Growth |
| OPS | Delivery Operations | Operations and Tooling |
| CX | Customer / Guest Experience and Support | Customer Experience and Retention |
| FIN | Finance and Risk / Compliance | Finance and Sustainability |
| DATA | Data and Measurement | Data Capture and Continuous Improvement |

These discrepancies are unambiguous corrections: the research brief is the canonical source.

### 5.3 Workflow Phase Label Alignment
The research brief uses `Workflow (Main Loop)` and `weekly_states` YAML keys. The fact-find proposes `Workflow` and `Workflow Phase` as the v2 field names. TASK-02 must formally adopt one label set. Recommended: use the fact-find labels (`workflow_phases[]`) as machine-readable field names; document research-brief aliases in the taxonomy glossary.

### 5.4 Multi-Phase Process Primary Phase Assignments
16 of 28 processes span 2+ phases. The primary_workflow_phase assignments in §4 are evidence-based but not yet reviewer-confirmed. The most likely review discussion items:

- **CDI-3** (Market/Competitor Scan): placed in `Sense` as primary; some operators may treat it as `Decide/Plan` since its outputs are recommendations, not just signals.
- **CX-2** (Reviews and Reputation): primary set to `Measure/Learn`; hospitality operators may argue `Deliver/Support` is primary given daily response requirements.
- **FIN-1** (Weekly Cash Review): `Sense` as primary; could be argued as `Decide/Plan` since spend guardrails are a decision output.

### 5.5 Conditional vs Always for CDI-2 and CDI-3
CDI-2 and CDI-3 are marked `conditional` due to cadence variation by business profile and stage. If the taxonomy contract decides to treat "reduced cadence" as still `always` (with frequency governed by activation_condition), these should be reclassified. This decision should be made in TASK-02 phase-semantics section.

---

## 6. Option B Delta Appendix

Option B would additionally rename stage short labels (e.g., `s1b`, `s2a`) to align with v2 vocabulary. This is **not in scope for the v2 core wave** (TASK-00 recommendation: Option A). The following changes would be added if Option B is later approved:

| Impact Area | Option A (v2 core) | Option B addition |
|---|---|---|
| `loop-spec.yaml` | No changes | Stage label strings updated |
| `stage-operator-dictionary.yaml` | No changes | `label` fields updated; `aliases` added for backward compat |
| All `--stage-label` consumers | No changes | Audit and update all CLI callers |
| `generate-stage-operator-views.ts` | No changes | Update label derivation logic |
| `stage-addressing.ts` | No changes | Update label resolution |
| Operator docs/skills | v2 vocabulary terms only | Stage label literals also updated |
| CI regression scope | Assignment + addressing | + label resolution tests |
| Risk level | Low (additive) | Medium-High (breaking if not shimmed) |

**Option B eligibility criteria** (evaluated at TASK-08 checkpoint):
- Assignment validator + regression suite fully passing.
- Operator mapping-time metric ≤15 min (or improved).
- No unresolved stage-label confusion in 2 consecutive weekly reviews.

---

## 7. Impacted File List (by Risk Group)

### Group A — Primary Implementation Targets (TASK-04)
| File | Change | Risk |
|---|---|---|
| `docs/business-os/startup-loop/process-registry-v1.md` | Add migration/deprecation notice | Low |
| `docs/business-os/startup-loop/process-registry-v2.md` | **Create** — v2 registry using canonical names | Low |

### Group B — New Artifacts (TASK-02, TASK-03)
| File | Change | Risk |
|---|---|---|
| `docs/business-os/startup-loop/workstream-workflow-taxonomy-v2.md` | **Create** — taxonomy contract | Low |
| `docs/business-os/startup-loop/workstream-workflow-taxonomy-v2.yaml` | **Create** — machine-readable enum source | Low |
| `docs/business-os/startup-loop/process-assignment-v2.yaml` | **Create** — 28-row assignment matrix | Low |

### Group C — Consumer Docs/Skills (TASK-06)
| File | Change | Risk |
|---|---|---|
| `docs/business-os/startup-loop/marketing-sales-capability-contract.md` | Vocabulary update | Low |
| `docs/business-os/startup-loop-workflow.user.md` | Vocabulary update | Low |
| `docs/business-os/startup-loop/event-state-schema.md` | Vocabulary update | Low |
| `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` | Vocabulary update | Low |
| `.claude/skills/lp-readiness/SKILL.md` | Vocabulary update | Low |
| `.claude/skills/lp-offer/SKILL.md` | Vocabulary update | Low |
| `.claude/skills/lp-channels/SKILL.md` | Vocabulary update | Low |
| `.claude/skills/lp-do-fact-find/SKILL.md` | Vocabulary update | Low |
| `.claude/skills/lp-do-plan/SKILL.md` | Vocabulary update | Low |
| `.claude/skills/lp-do-build/SKILL.md` | Vocabulary update | Low |

### Group D — Code + Tests (TASK-05, TASK-07)
| File | Change | Risk |
|---|---|---|
| `scripts/src/startup-loop/validate-process-assignment.ts` | **Create** — validator script | Medium |
| `scripts/src/startup-loop/__tests__/validate-process-assignment.test.ts` | **Create** — validator tests | Medium |
| `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts` | Extend: compatibility fixtures | Medium |
| `scripts/src/startup-loop/__tests__/stage-addressing.test.ts` | Extend: legacy-addressing fixture | Medium |
| `scripts/src/startup-loop/__tests__/derive-state.test.ts` | Extend: stage name derivation | Medium |

### Group E — Read-Only (no edits permitted in v2 core)
| File | Reason |
|---|---|
| `docs/briefs/orchestrated-business-startup-loop-operating-system-research.md` | Canonical research reference; frozen |
| `docs/business-os/startup-loop/loop-spec.yaml` | Stage ordering authority; out-of-scope by TASK-00 |
| `docs/business-os/startup-loop/stage-operator-dictionary.yaml` | Stage addressing source; out-of-scope unless Option B approved |

---

## 8. Validation Closure

Per TASK-01 acceptance criteria — this artifact closes when every process has a candidate `workstream_id` and at least one `workflow_phase`.

- Total processes: **28/28** ✓
- Processes with `workstream_id`: **28/28** ✓
- Processes with at least one `workflow_phase`: **28/28** ✓
- Contested mappings: **0** ✓
- Known ambiguities documented: **5 items** ✓
- Option B delta appendix included: ✓
- Impacted file list by risk group: ✓

**Investigation status: COMPLETE.**
