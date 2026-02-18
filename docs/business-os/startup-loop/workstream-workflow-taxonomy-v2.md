---
Type: Taxonomy Contract
Version: "2.0"
Status: Active
Created: 2026-02-18
Decision-Record: docs/plans/startup-loop-orchestrated-os-comparison-v2/decisions/v2-scope-boundary-decision.md
Research-Source: docs/briefs/orchestrated-business-startup-loop-operating-system-research.md
Machine-Readable-Source: docs/business-os/startup-loop/workstream-workflow-taxonomy-v2.yaml
---

# Workstream and Workflow Taxonomy v2

Canonical vocabulary contract for the startup-loop operating system. All process registry v2, assignment matrix, skill documentation, and operator tooling must reference this contract as the authoritative source for workstream and workflow phase definitions.

---

## Core Definitions

These three terms have distinct meanings and must never be conflated.

| Term | Concept | Example |
|---|---|---|
| **Workstream** | A business-function group of related processes sharing the same functional purpose. 7 canonical workstreams; each process belongs to exactly one workstream. | CDI: Customer Discovery and Market Intelligence |
| **Workflow Phase** | A named step within the weekly operating Workflow cycle. 7 canonical phases in fixed execution order. A single process can be assigned to one or more phases. | Sense and Diagnose (order: 1) |
| **Stage** | A node in the startup-loop stage graph (S0–S10). Governs the build sequence, gate criteria, and entry/exit conditions. Entirely separate from workstreams and workflow phases. | S6B: GTM strategy |

### Anti-conflation rule

**`workstream` ≠ `workflow_phase`**

A workstream is a functional grouping of **who owns** a process (e.g., CDI processes are owned by the customer intelligence function). A workflow phase is **when in the weekly cycle** that process runs (e.g., CDI-1 runs in Sense and in Decide/Plan). A single workstream can have processes spanning multiple workflow phases. Never substitute one for the other in field names, documentation headings, or tool arguments.

---

## 1. Canonical Workstreams (7)

### CDI — Customer Discovery and Market Intelligence

**Description:** Processes for understanding customers, markets, and the competitive landscape. Covers weekly signal intake, field validation interviews, market and competitor scanning, and experiment backlog design.

**Research alignment:** Corresponds to "Workstream: Customer discovery and market intelligence" in the research brief process catalogue (`docs/briefs/orchestrated-business-startup-loop-operating-system-research.md`).

**Processes:** CDI-1, CDI-2, CDI-3, CDI-4

**Anti-example:** Running a paid advertising campaign is **not** a CDI process — demand execution belongs to GTM. Analysing a post-campaign report is DATA or CDI (insight synthesis), not GTM. CDI is about learning and generating insight, not executing demand.

---

### OFF — Offering and Pricing

**Description:** Processes for iterating the product or service offer, setting and reviewing pricing, refreshing listing and merchandising content, and managing channel policy and conflict.

**Research alignment:** Corresponds to "Workstream: Offering and pricing" in the research brief.

**Processes:** OFF-1, OFF-2, OFF-3, OFF-4

**Anti-example:** Fulfilling an order or delivering a service is **not** an OFF process — that is OPS. OFF governs what we offer and at what price; OPS governs how we deliver it.

---

### GTM — Go-to-Market and Growth

**Description:** Processes for planning and executing demand generation campaigns, operating distribution channels, managing sales and account pipeline, and automating conversion and lifecycle sequences.

**Research alignment:** Corresponds to "Workstream: Go-to-market and growth" in the research brief.

**v1 alias:** v1 registry used "Go-to-Market and Distribution" — the canonical v2 name is **Go-to-Market and Growth**.

**Processes:** GTM-1, GTM-2, GTM-3, GTM-4

**Anti-example:** Updating a guest check-in SOP is **not** a GTM process — that is CX or OPS. GTM is about generating demand and acquiring customers, not serving or retaining them post-acquisition.

---

### OPS — Operations and Tooling

**Description:** Processes for capacity and inventory planning, delivery or stay execution, handling returns and refunds, and quality assurance and maintenance management.

**Research alignment:** Corresponds to "Workstream: Operations and tooling" in the research brief.

**v1 alias:** v1 registry used "Delivery Operations" — the canonical v2 name is **Operations and Tooling**.

**Processes:** OPS-1, OPS-2, OPS-3, OPS-4

**Anti-example:** Writing a review response or handling a support ticket is **not** an OPS process — that is CX. OPS covers capacity, inventory, and delivery mechanics, not customer-facing relationship work.

---

### CX — Customer Experience and Retention

**Description:** Processes for support triage and service recovery, review and reputation management, retention and loyalty loop execution, and SOP and training maintenance.

**Research alignment:** Corresponds to "Workstream: Customer experience and retention" in the research brief.

**v1 alias:** v1 registry used "Customer / Guest Experience and Support" — the canonical v2 name is **Customer Experience and Retention**.

**Processes:** CX-1, CX-2, CX-3, CX-4

**Anti-example:** Setting a pricing strategy or updating an offer catalogue is **not** a CX process — that is OFF. CX handles the customer's experience and relationship after engagement; OFF governs what is offered before and during acquisition.

---

### FIN — Finance and Sustainability

**Description:** Processes for weekly cash and unit economics review, billing payouts and reconciliation, risk register and compliance readiness, and vendor and procurement management.

**Research alignment:** Corresponds to "Workstream: Finance and sustainability" in the research brief.

**v1 alias:** v1 registry used "Finance and Risk / Compliance" — the canonical v2 name is **Finance and Sustainability**.

**Processes:** FIN-1, FIN-2, FIN-3, FIN-4

**Anti-example:** Running a paid advertising campaign or deciding on channel spend is **not** a FIN process — demand spend execution is GTM, channel policy is OFF. FIN tracks and controls financial health; GTM executes demand spend within FIN-issued guardrails.

---

### DATA — Data Capture and Continuous Improvement

**Description:** Processes for KPI refresh and data integrity, leading indicator monitoring and alerting, incident post-mortems and corrective actions, and weekly review facilitation and decision logging.

**Research alignment:** Corresponds to "Workstream: Data capture and continuous improvement" in the research brief.

**v1 alias:** v1 registry used "Data and Measurement" — the canonical v2 name is **Data Capture and Continuous Improvement**.

**Processes:** DATA-1, DATA-2, DATA-3, DATA-4

**Anti-example:** Analysing competitor pricing or conducting customer interviews is **not** a DATA process — that is CDI. DATA captures and processes operational and performance metrics; market intelligence and customer research belong to CDI.

---

## 2. Canonical Workflow Phases (7)

Phases run in fixed order within each weekly cycle. Individual process activation may be conditional or exception-only (see §4), but the phase sequence itself is invariant.

| Order | Phase ID | Phase Name | Description |
|---|---|---|---|
| 1 | Sense | Sense and Diagnose | Pull KPI pack, refresh leading indicators, scan market and operational signals. Weekly orientation before decisions. |
| 2 | Decide/Plan | Decide and Plan | Set weekly priorities, allocate budgets, commit capacity, update experiment backlog. Highest-orchestration moment. |
| 3 | Build/Prepare | Build and Prepare | Execute content updates, SOP changes, listing refreshes, maintenance schedules. Prepare delivery capability. |
| 4 | Sell/Acquire | Sell and Acquire Demand | Run campaigns, operate distribution channels, manage sales pipeline, execute lifecycle outreach. |
| 5 | Deliver/Support | Deliver and Support | Fulfil orders or stays, triage support issues, process returns and refunds, perform quality assurance. |
| 6 | Measure/Learn | Measure and Learn | Review cycle results, post-mortems, cohort analysis, billing reconciliation, data integrity checks. |
| 7 | Weekly Review | Weekly Review | DATA-4 facilitation: cross-workstream KPC review, decision log, next-cycle intent. |

---

## 3. Phase Semantics

### What it means to be assigned to a phase

A process is assigned to a workflow phase when **the primary work of that process — producing its output and handing it off — occurs during that phase's window**. Assignment does not mean the phase is the only time a person touches the process; it means the operationally significant output is produced during that phase.

### Multi-phase assignment

A process may be assigned to multiple phases when:

- The process **spans a phase boundary** — it generates distinct outputs in each phase (e.g., CDI-1 pulls signals in Sense and feeds decisions in Decide/Plan, producing two distinct hand-offs).
- The process has **clearly separated activities** in different phases with their own outputs and recipients (e.g., OPS-3 processes returns daily in Deliver/Support and synthesises trends weekly in Measure/Learn).

Multi-phase assignment is not used when the process merely references or consumes outputs from a prior phase — only when it actively produces distinct outputs in each listed phase.

### `primary_workflow_phase` — required for all processes

Every process in the assignment matrix must include a `primary_workflow_phase` field identifying the **one phase where the most operationally significant work occurs**. For single-phase processes, `primary_workflow_phase` equals the sole entry in `workflow_phases[]`.

### Ordering rule

When a process spans multiple phases, the `workflow_phases[]` array must list phase IDs in ascending execution order. No phase ID may appear more than once per process.

---

## 4. Activation Semantics

Three allowed activation tokens. Any token not in this list is invalid and validators must reject it.

| Token | Meaning | `activation_condition` required? |
|---|---|---|
| `always` | Runs every weekly cycle without exception | No |
| `conditional` | Runs when a specified condition is met | Yes |
| `exception_only` | Runs only when triggered by an exception state | Yes |

### `conditional` activation

When `activation: conditional`, the `activation_condition` field must state:
- The triggering condition: a business profile flag (e.g. `inventory_present`, `wholesale_heavy`, `OTA_mix_high`), a stage gate (e.g. `CAP-05`, `CAP-06`, post-S9 launch), or a metric threshold.
- Whether the default is "always run unless suppressed" (reduced cadence) or "skip unless triggered" (profile-conditional).

**Cadence reduction rule:** A process with a reduced-frequency cadence (biweekly, monthly) is classified as `conditional`, not `always`. The `activation_condition` must state the reduced frequency and the triggering profile or stage.

### `exception_only` activation

When `activation: exception_only`, the `activation_condition` field must name the specific exception state(s) that trigger the process (e.g., `"Demand Shock, Cash Constraint"`). No regular weekly cadence.

---

## 5. Alias and Deprecation Policy

### Deprecated terms

| Legacy Term | Context | Canonical v2 Replacement |
|---|---|---|
| `Domain:` (section heading) | process-registry-v1.md section headings for process groupings | `Workstream:` |
| `Domain` (column header) | Quick Reference Index column in process-registry-v1.md | `Workstream` |
| `Go-to-Market and Distribution` | v1 GTM workstream long-form name | `Go-to-Market and Growth` |
| `Delivery Operations` | v1 OPS workstream long-form name | `Operations and Tooling` |
| `Customer / Guest Experience and Support` | v1 CX workstream long-form name | `Customer Experience and Retention` |
| `Finance and Risk / Compliance` | v1 FIN workstream long-form name | `Finance and Sustainability` |
| `Data and Measurement` | v1 DATA workstream long-form name | `Data Capture and Continuous Improvement` |
| `weekly_states` | research brief YAML pseudo-spec key for workflow phases | `workflow_phases` |

### Policy rules

1. Deprecated terms must be replaced with canonical terms in all new and updated documents.
2. If a deprecated term is retained in a specific file for historical continuity, it must be marked: `# legacy alias for: <canonical term>`.
3. The frontmatter `Domain` field used for venture-studio / BOS classification (e.g., `Domain: Business-OS`) is **out of scope** for this rename — it refers to a different concept and requires a separate decision.
4. The workstream short codes (CDI, OFF, GTM, OPS, CX, FIN, DATA) are canonical and stable. They must not be changed.

---

## 6. Terminology Crosswalk

| Research Brief Term | v1 Registry Term | v2 Canonical Term | Notes |
|---|---|---|---|
| Workflow (Main Loop) | _(not used)_ | Workflow | The end-to-end repeating weekly operating cycle |
| weekly_states keys | _(not used)_ | Workflow Phase IDs (Sense, Decide/Plan, …) | Named steps within the Workflow cycle |
| Workstream | Domain (section heading) | Workstream | Business-function grouping of processes |
| Go-to-market and growth | Go-to-Market and Distribution | Go-to-Market and Growth | GTM long-form name |
| Operations and tooling | Delivery Operations | Operations and Tooling | OPS long-form name |
| Customer experience and retention | Customer / Guest Experience and Support | Customer Experience and Retention | CX long-form name |
| Finance and sustainability | Finance and Risk / Compliance | Finance and Sustainability | FIN long-form name |
| Data capture and continuous improvement | Data and Measurement | Data Capture and Continuous Improvement | DATA long-form name |
| Stage (S0–S10) | Stage | Stage | Startup-loop build stage graph; unchanged |

---

## 7. Decision Record

This taxonomy implements the decisions recorded in:
`docs/plans/startup-loop-orchestrated-os-comparison-v2/decisions/v2-scope-boundary-decision.md`

Key implications:
- **Option B:** Stage labels are renamed in the v2 wave. This taxonomy defines the canonical workstream long-form names that any stage labels referencing them must align to.
- **supersede-now:** `process-registry-v1.md` is immediately superseded on merge. This taxonomy governs all v2 contract language from that point.
- **Stage authority:** Stage ordering, stage IDs, and gate semantics remain authoritative in `docs/business-os/startup-loop/loop-spec.yaml`. This taxonomy governs process-layer vocabulary only.
