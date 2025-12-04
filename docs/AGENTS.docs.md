Type: Guide
Status: Active
Domain: Documentation
Last-reviewed: 2025-12-02

# AI‑First Documentation Runbook

This guide defines how documentation in this repo is structured and written so that both humans and AI agents can quickly find:

- Objectives and invariants for a given area (CMS, runtime, i18n, theming, etc.).
- Current status (what’s done vs planned) and where the implementation lives in code.

It builds on the existing structure (`AGENTS.md`, `docs/index.md`, `docs/cms-plan/*`, architecture/runtime docs, ADRs, etc.) and formalises a small set of conventions.

---

## 1. Global Rules

- **Code is truth**
  - When behaviour in any doc contradicts the code, treat the **code** as canonical and update the doc as a follow‑up.
  - Contracts and Charters are the most trustworthy docs; Research and Plans can describe desired or transitional states.

- **Docs are indexed for agents**
  - Every non‑trivial doc should start with a small metadata header (`Type`, `Status`, `Domain`, etc.).
  - An AI should be able to decide *how to use* a doc (canonical vs historical vs backlog) from the header alone.

- **Planning lives in Plan docs**
  - Plan‑type docs (`IMPLEMENTATION_PLAN.md`, `docs/*-plan/*.md`) are the primary “interface into planning”.
  - Agents and humans should pick, add, or update work items by editing the relevant Plan doc, not by inventing ad‑hoc checklists elsewhere.

- **Plan docs follow a shared pattern**
  - Every Plan must declare:
    - `Type: Plan`, `Status`, `Domain`, `Last-reviewed`, and `Relates-to charter`.
  - Each Plan should include:
    - An **Active tasks** section with IDs, statuses, scope, dependencies, and definition‑of‑done.
    - An optional **Completed** / **Frozen** section for history.
  - Task IDs are domain‑specific (for example `CMS-*`, `DOC-*`, `RT-*`, `THEME-*`, `I18N-*`, `COM-*`) and should be stable so agents can reference them.

- **Registry powers tooling**
  - The docs-lint script (`pnpm docs:lint`) writes `docs/registry.json` with `{ path, type, status, domain }` entries.
  - Tools and agents can import `scripts/src/docs-registry.ts` to load and query the registry (for example, “give me all Contracts for Domain = CMS”).

---

## 2. Where Things Are Today (High‑Level Map)

From an AI’s point of view, the repo already has many of the right building blocks:

- **AI‑facing runbooks**
  - `AGENTS.md` at the root: global AI runbook for the monorepo.
  - `apps/*/AGENTS*.md`: app‑ and locale‑specific instructions (for example `apps/skylar/AGENTS.en.md`).

- **Human‑style index**
  - `docs/index.md`: entry point grouped by theme (Getting Started, Theming, Reference, etc.).

- **Domain‑rich CMS stack**
  - `docs/historical/cms-research.md`: goals, questions, findings, open questions.
  - `docs/cms-plan/*.md`: multi‑thread plan with tasks and dependencies.
  - `docs/shop-editor-refactor.md`: deep dive on a specific refactor.
  - Additional CMS‑related guides under `docs/` and app‑local docs under `apps/cms/src/...`.

- **Runtime / platform architecture**
  - `docs/architecture.md`
  - `docs/persistence.md`
  - `docs/platform-vs-apps.md`
  - `docs/runtime/template-contract.md`

- **Plans and implementation snapshots**
  - `IMPLEMENTATION_PLAN.md`: Base‑Shop app plan, sprint tracker, launch checklist.

- **ADRs**
  - `docs/adr/adr-00-i18n-foundation.md`: clear `Status`, `Decision`, `Consequences`.

The main issues this runbook addresses:

- **Doc types are mixed together**
  - Research, plans, contracts, guides, and ADRs live side‑by‑side, but filenames and headers don’t always say which is which or how “truthy” they are.

- **Structure is present but implicit**
  - CMS docs span `docs/`, `docs/cms-plan/`, and `apps/cms/...`.
  - Runtime/platform docs are strong but not grouped under a clear “runtime” or “platform” index.

- **Machine‑orientation is uneven**
  - Some docs are extremely AI‑friendly (clear goals, contracts, explicit code entrypoints).
  - Others are more narrative; an agent has to skim before knowing whether a doc is canonical, historical, or a backlog.

This runbook makes that structure explicit and predictable.

---

## 3. Doc Types and Metadata (Taxonomy)

All non‑trivial docs should declare a **type** and **status** at the top, plus a few key fields so an AI can decide how to use them without reading the body.

### 3.1 Doc Types

We standardise on four primary types. ADRs keep their own existing format and `Status` field.

#### 3.1.1 Charter

- **Purpose**
  - Define the *“why”* and stable *“what”* for a domain.
  - Answer:
    - What are the goals?
    - What are the core flows?
    - What contracts back these flows?
    - What is out of scope?

- **Domains (examples)**
  - CMS, Runtime, Platform, i18n, Theming, Orders/Returns/Logistics, SEO, Base‑Shop.

- **Location and naming**
  - File name pattern:
    - `docs/<area>-charter.md`, or
    - `docs/<domain>/<domain>-charter.md`.
  - Examples:
    - `docs/cms/cms-charter.md`
    - `docs/runtime/runtime-charter.md`
    - `docs/base-shop-charter.md`

- **Header fields**
  - `Type: Charter`
  - `Status: Canonical | Draft | Deprecated`
  - `Domain: <Domain>`
  - `Last-reviewed: YYYY-MM-DD`
  - `Primary code entrypoints:`
    - Bullet list of relevant paths and, ideally, key symbols.

- **Recommended sections**
  - Goals
  - Core flows (2–6 bullets; for example “Create shop via /cms/configurator”, “Launch via ConfigChecks + deploy adapter”).
  - Key contracts (links to Contract docs).
  - Out of scope / historical pointers (where *not* to read for current behaviour).

For CMS, the charter should become the first stop instead of overloading `cms-research.md` (now archived under `docs/historical`).

#### 3.1.2 Contract

- **Purpose**
  - Define observable behaviour and invariants, tied to specific code, without wish‑listing future ideas.
  - Examples:
    - Request/response shapes.
    - Template/runtime behaviour.
    - Persistence and repository behaviour.
    - Configurator flows.

- **Location and naming**
  - File name pattern:
    - `docs/<area>-contract.md` for small surface areas, or
    - `docs/<domain>/<topic>-contract.md` for larger domains.
  - Examples:
    - `docs/runtime/template-contract.md` (already exists).
    - `docs/cms/configurator-contract.md` (future).
    - `docs/persistence.md` (can be tagged as a Contract).

- **Header fields**
  - `Type: Contract`
  - `Status: Canonical | Draft`
  - `Domain: <Domain>`
  - `Implements: <Charter section>` (for example `cms-charter::Configurator & Launch`).
  - `Canonical code:`
    - Bullet list of paths and key symbols.

- **Standard note**
  - Every Contract and Charter should include:
    - “If behaviour in this doc contradicts the code, treat the code as canonical and update this doc as a follow‑up.”

Contracts should stick to **current behaviour**. Ideas and future variations belong in Plans or Research.

#### 3.1.3 Plan

- **Purpose**
  - Capture “where we are and what’s next” with explicit tasks, dependencies, and status.
  - Plan docs are the **primary planning interface** for agents and humans.

- **Usage**
  - Cross‑domain roadmap:
    - `IMPLEMENTATION_PLAN.md` — global or Base‑Shop‑specific plan (mark clearly in its header).
  - Domain‑specific plans:
    - `docs/<domain>-plan/index.md` or
    - `docs/<domain>/plan/index.md` with per‑thread files.
    - Existing CMS structure (`docs/cms-plan/index.md`, `master-thread.md`, `thread-*.md`) already fits this model.

- **Header fields**
  - `Type: Plan`
  - `Status: Active | Frozen | Superseded`
  - `Domain: <Domain>`
  - `Relates-to charter: <charter file or anchor>`

- **Conventions**
  - Tasks have explicit IDs and checkboxes:
    - `[ ] CMS-12: Implement ConfigCheck for theme publish`
    - `[x] CMS-07: Introduce shop template contract`
  - For each task:
    - Scope (1–3 lines).
    - Implementation hints (optional).
    - Dependencies.
    - Definition of done.

Plans are the source of truth for **status**, not for **exact behaviour** (that is code + Contracts).

#### 3.1.4 Research / Log / Guide

These are non‑canonical by default but still important context.

- **Research / Log**
  - Purpose:
    - Capture background analysis, experiments, “questions → findings → remaining gaps”.
  - Examples:
    - `docs/historical/cms-research.md`
    - `docs/shop-editor-refactor.md` (consider renaming to `shop-editor-refactor-research.md` or adding a clear `Type: Research` header).

- **Guides**
  - Purpose:
    - Human‑oriented walkthroughs and workflows (operator guides, “how to” docs).
  - Examples:
    - `docs/cms.md`
    - `docs/storybook.md`
    - `docs/cypress.md`

- **Location and naming**
  - File names:
    - `<area>-research.md` or `<domain>/<topic>-research.md`
    - `<topic>-guide.md` or `<domain>/<topic>-guide.md`

- **Header fields**
  - `Type: Research | Guide | Log`
  - `Status: Active | Reference | Historical | Superseded`
  - `Domain: <Domain>`
  - `Superseded-by: <file>` (when applicable).

- **Recommended structure for Research**
  - Goals.
  - Questions.
  - Findings.
  - Remaining gaps / Open questions.

For agents, anything marked `Type: Research` or `Status: Historical` is **input/context**, not canonical truth.

### 3.2 Status Vocabulary

Use a small, standard set of status values:

- `Canonical` — primary truth among docs, subject to the “code is truth” rule.
- `Active` — currently in use and maintained, but not necessarily canonical.
- `Draft` — in progress; use cautiously.
- `Reference` — still useful but not guaranteed to be fully up to date.
- `Historical` — kept only for history; should not be used for current behaviour.
- `Superseded` — replaced by another doc; always specify `Superseded-by:`.

ADRs keep their existing `Status` field; align wording to this vocabulary where it makes sense.

---

## 4. Naming, Location, and Discoverability

The repo already has good anchors; these conventions make them more predictable for agents.

### 4.1 Directory Layout

- Keep `docs/` as the hub.

- Use subfolders for rich domains:
  - `docs/cms/`
    - `cms-charter.md`
    - `cms-contracts.md` or per‑topic Contracts.
    - `cms-guide.md` (for operators).
    - Optional `research/`, `plan/` if you want deeper nesting.
    - Optionally move `docs/cms-plan/` into `docs/cms/plan/`.
  - `docs/runtime/`
    - `runtime-charter.md`
    - `template-contract.md`
    - Runtime‑specific guides or research.
  - `docs/i18n/`
    - `i18n-charter.md` (linking to `docs/adr/adr-00-i18n-foundation.md` and implementation docs).

- Keep cross‑cutting docs at the top level (but tag them with metadata):
  - `docs/architecture.md`
  - `docs/platform-vs-apps.md`
  - `docs/persistence.md`
  - `docs/typescript.md`, `docs/tsconfig-paths.md`, etc.

### 4.2 File Name Conventions

Prefer self‑describing names:

- `*-charter.md`
- `*-contract.md`
- `*-plan.md`
- `*-guide.md`
- `*-research.md`
- `*-log.md` (if logs are preferred in some areas).

For ambiguous existing docs like `shop-editor-refactor.md`, either:

- Rename to `shop-editor-refactor-research.md`, or
- Keep the name but add a clear `Type: Research` header.

### 4.3 docs/index.md

Enhance `docs/index.md` with a short “For agents” section at the top:

- Describe the four doc types and status vocabulary.
- Link to:
  - `AGENTS.md` and `docs/AGENTS.docs.md` (this runbook).
  - Core charters (CMS, runtime, Base‑Shop).
  - Key contracts (runtime template, persistence, platform vs apps).
  - Active plans (`IMPLEMENTATION_PLAN.md`, `docs/cms-plan/index.md`).

This gives agents and humans an immediate high‑level map.

---

## 5. Strengthening the Code ↔ Doc Bridge

The goal is to make every important doc a reliable map to real code.

### 5.1 Primary Code Entrypoints

Charters and Contracts should always include a `Primary code entrypoints` or `Canonical code` section:

- Use bullet lists, for example:
  - `apps/cms/src/app/cms/configurator`
  - `packages/platform-core/src/repositories/shops.server.ts`
  - `apps/shop-secret/src/app/api/cart/route.ts`

This:

- Gives agents a direct path to verify behaviour.
- Makes it clear where invariants are enforced.
- Makes refactors easier to track (update one list when paths change).

### 5.2 Explicit “Code is Truth” Rule

- Every Charter and Contract must include the invariant:
  - “If behaviour in this doc contradicts the code, treat the code as canonical and update this doc as a follow‑up.”
- Research and Plan docs should **not** claim to be canonical; they may describe desired states, experiments, and partial implementations.

---

## 6. Concrete Migration Path

We do not need a big‑bang rewrite. Instead, converge incrementally.

### 6.1 Step 1 – Document the Taxonomy

- Keep this file (`docs/AGENTS.docs.md`) as the single source of truth for doc structure.
- Link it from:
  - `AGENTS.md` at the repo root.
  - A new “For agents” section in `docs/index.md`.
- Ensure the following are clearly stated:
  - Doc types and statuses.
  - The “code is truth” rule.
  - Plan docs as the primary planning interface.

### 6.2 Step 2 – Create Initial Charters

Start with the highest‑leverage domains:

- **CMS Charter**
  - Summarise:
    - Goals and flows from `docs/historical/cms-research.md`.
    - Current direction from `docs/cms-plan/master-thread*.md`.
    - Actual behaviour from CMS code (configurator, editor, launch flows).
  - Place at `docs/cms/cms-charter.md`.

- **Runtime Charter**
  - Bridge:
    - `docs/architecture.md`
    - `docs/platform-vs-apps.md`
    - `docs/runtime/template-contract.md`
    - `docs/persistence.md`
  - Place at `docs/runtime/runtime-charter.md`.

- **Base‑Shop Charter**
  - Either:
    - Create `docs/base-shop-charter.md` and link it to `IMPLEMENTATION_PLAN.md`, or
    - Clearly mark the top of `IMPLEMENTATION_PLAN.md` as:
      - `Type: Plan`
      - `Domain: Base-Shop`
      - And include a short charter section within it.

Keep charters relatively short and link out to Research and Plan docs for depth.

### 6.3 Step 3 – Tag Existing Docs with Types and Status

As you touch docs, add the header block at the top:

- `docs/historical/cms-research.md`
  - `Type: Research`
  - `Status: Historical`
  - `Superseded-by: docs/cms/cms-charter.md, docs/cms-plan/index.md, docs/cms/configurator-contract.md, docs/cms/build-shop-guide.md`

- `docs/cms-plan/*.md`
  - `Type: Plan`
  - `Status: Active`

- `docs/architecture.md`, `docs/persistence.md`, `docs/platform-vs-apps.md`, `docs/runtime/template-contract.md`
  - `Type: Contract`
  - `Status: Canonical`

- `docs/adr/adr-00-i18n-foundation.md`
  - Ensure `Status:` aligns with the shared vocabulary (for example `Status: Proposed` ⇒ treat as `Draft`).

This is low‑effort and immediately valuable for agents that filter docs by `Type` or `Status`.

### 6.4 Step 4 – Refine CMS Around the Charter

- Treat `docs/cms/cms-charter.md` as the canonical map of:
  - Goals.
  - Core flows.
  - Key contracts.
- Keep `docs/historical/cms-research.md` as a deep, append‑only log, clearly marked as `Type: Research` and `Status: Historical`.
- Use `docs/cms-plan/` as the active Plan.
- Over time, add focused contracts, e.g.:
  - `docs/cms/configurator-contract.md` for ConfigCheck APIs, configurator routes, and their behaviours.

### 6.5 Step 5 – Gradually Align Other Domains

- **i18n**
  - Add `docs/i18n/i18n-charter.md` that:
    - Links to `docs/adr/adr-00-i18n-foundation.md`.
    - Points to core i18n implementation packages and helpers.

- **Theming**
  - Introduce `docs/theming/theming-charter.md`, or tag `docs/theming.md` as a Charter.
  - Use it to anchor:
    - `docs/theming-advanced.md`
    - `docs/palette.md`
    - `docs/typography-and-color.md`
    - `docs/theme-lifecycle-and-library.md`

- **Orders / Returns / Logistics / SEO**
  - Add small, focused charters tying:
    - `docs/orders.md`
    - `docs/returns.md`
    - `docs/reverse-logistics-events.md`
    - `docs/seo.md`
  - To the relevant repositories and services.

### 6.6 Step 6 – Adopt the Pattern for All New Docs

When adding new docs (for example “Build & Style a Shop”):

- Decide the type:
  - `Guide` for operators / implementers.
  - `Charter` if it encodes invariants.
- Add the standard header:
  - `Type`, `Status`, `Domain`, `Last-reviewed`, and (for Charters/Contracts) `Primary code entrypoints` / `Canonical code`.
- Link to the relevant Charter and Contract(s).

This keeps the documentation ecosystem coherent as it grows.

---

## 7. Future Improvements (Optional)

These are not required but can further improve consistency over time.

### 7.1 Lightweight Doc Linting

- Add a small script or CI check that:
  - Ensures each doc under `docs/` starts with a `Type:` line.
  - Warns if `Type: Charter | Contract` is missing `Domain:` or `Primary code entrypoints:` / `Canonical code:`.
  - Optionally validates `Status:` against the agreed vocabulary.

### 7.2 Templates and Snippets

- Provide small templates for each type:
  - `docs/templates/charter-template.md`
  - `docs/templates/contract-template.md`
  - `docs/templates/plan-thread-template.md`
  - `docs/templates/research-template.md`
- For humans, editor snippets help maintain consistency; for agents, templates make intent and structure predictable.

### 7.3 Cross‑Doc Index for Agents

- Optionally maintain a generated `docs/registry.json` or `docs/_index.md` with:
  - File path.
  - `Type`.
  - `Status`.
  - `Domain`.
- An AI or small script can generate/update this from headers, giving agents a single place to scan for a global view.

### 7.4 Explicit Links from Code to Docs

- In key modules, include short comments such as:
  - `// Docs: docs/runtime/template-contract.md`
  - `// Docs: docs/cms/cms-charter.md`
- This makes it easier (for humans and AI) to move from code → doc and back.

### 7.5 Versioning for Major Behavioural Shifts

- When behaviour changes significantly:
  - Update the relevant Contract(s).
  - Consider adding a new ADR.
  - Mark older research as `Historical` with `Superseded-by:` pointing to new canonical docs.
