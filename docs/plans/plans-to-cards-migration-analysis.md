---
Type: Analysis
Status: Reference
Last-updated: 2026-02-05
---
# Plans → Cards Migration Feasibility Analysis

**Date:** 2026-01-31
**Purpose:** Evaluate feasibility of creating initial Business OS cards from existing plan files

---

## Executive Summary

**Feasibility: ✅ HIGH** - Migration is feasible with a conversion script + schema enhancements.

**Key Findings:**
- 73 total plan files in `docs/plans/`
- 43 Active/Draft plans (candidates for Kanban cards)
- Plans have rich frontmatter but need field mapping + defaults
- Conversion would create a working baseline for the hourly D1↔git sync

**Recommended Approach:**
1. Enhance plan frontmatter with Business OS card fields
2. Create conversion script: `docs/plans/*.md` → D1 cards
3. Run migration to create initial card baseline
4. Use hourly git export for ongoing sync (D1 canonical)

---

## Current State Analysis

### Plan Files Inventory

```
Total plan files: 73
├── Active: 32 plans
├── Draft: 11 plans
├── Complete: 10 plans
├── Ready-for-planning: 10 plans
└── Other statuses: 10 plans
```

**Domain Distribution:**
- Platform: 7 plans
- CMS: 8 plans
- UI: 5 plans
- Business OS: 2 plans
- Testing: 5 plans
- Commerce: 4 plans
- Other: 42 plans

**Feature-Slug Coverage:**
- 25/73 plans have `Feature-Slug` field
- 48/73 plans missing explicit slug

### Plan Frontmatter Structure

**Typical plan frontmatter:**
```yaml
---
Type: Plan
Status: Active | Draft | Complete
Domain: Platform | CMS | UI | Business OS
Created: YYYY-MM-DD
Last-reviewed: YYYY-MM-DD
Last-updated: YYYY-MM-DD
Feature-Slug: kebab-case-name  # Only 34% have this
Build-progress: X/Y tasks complete  # Variable format
Overall-confidence: NN%  # Some plans only
---
```

### Business OS Card Schema (Required Fields)

**Must-have fields:**
```typescript
{
  Type: "Card",           // ✅ Can default
  Lane: Lane,             // ⚠️ Must derive from Status
  Priority: Priority,     // ⚠️ Must derive/default
  Owner: string,          // ⚠️ Must default (Pete)
  ID: string,             // ⚠️ Must generate from slug or filename
  Created: string,        // ✅ Have "Created" field
  Updated: string,        // ✅ Have "Last-updated" field
  content: string,        // ✅ Have markdown body
  filePath: string        // ✅ Can derive from file location
}
```

**Optional but valuable:**
```typescript
{
  Title: string,          // ⚠️ Extract from # heading
  Business: string,       // ⚠️ Map from Domain
  Tags: string[],         // ⚠️ Could derive from Domain
  Dependencies: string[], // ❌ Not in plans
  "Due-Date": string,     // ❌ Not in plans
  Blocked: boolean,       // ❌ Not in plans
}
```

---

## Field Mapping Strategy

### 1. Status → Lane Mapping

| Plan Status | Card Lane | Rationale |
|-------------|-----------|-----------|
| Draft | Fact-finding | Still being researched/defined |
| Ready-for-planning | Fact-finding | Research complete, not planned |
| Active | Planned | Plan exists, ready for execution |
| In Progress | In progress | Currently being built |
| Complete / Completed | Done | Finished |
| Implemented | Done | Finished |
| Superseded | Done | Archived/completed |
| Accepted | Planned | Approved but not started |
| Reference | Done | For reference only |

**Decision needed:** What lane for "Proposed"? (Suggest: Inbox)

### 2. Domain → Business Mapping

| Plan Domain | Business Code | Notes |
|-------------|---------------|-------|
| Business OS | BOS | Direct match |
| Platform | PLAT | Platform infrastructure |
| CMS | BRIK | Brikette CMS |
| UI | BRIK | UI for Brikette |
| Commerce | BRIK | Commerce features |
| Guides / Content / SEO | BRIK | Content work |
| Testing | PLAT | Cross-cutting |
| DevEx/Tooling | PLAT | Developer tools |
| Infrastructure | PLAT | Infra work |
| (Compound domains) | PLAT | Default to platform |

**Decision needed:** Confirm Business codes (BOS, PLAT, BRIK, SKYL?)

### 3. Priority Derivation

**Option A - Status-based:**
- In Progress → P0 (actively working)
- Active → P1 (ready to start)
- Draft → P2 (needs more work)
- Other → P3 (backlog)

**Option B - Explicit field:**
- Add `Priority:` to plan frontmatter
- Migrate with defaults, allow manual updates

**Option C - Confidence-based:**
- Overall-confidence ≥90% → P1
- Overall-confidence 70-89% → P2
- Overall-confidence <70% → P3

**Recommended:** Option A + manual refinement post-migration

### 4. ID Generation

**Current situation:**
- 25/73 plans have Feature-Slug
- 48/73 plans need ID generation

**Options:**

**Option A - From Feature-Slug (preferred):**
```
Feature-Slug: database-backed-business-os
Business: PLAT (derived from Domain: Platform)
→ ID: PLAT-ENG-0001
```

**Option B - From filename:**
```
File: docs/plans/brikette-translation-coverage-plan.md
→ Slug: brikette-translation-coverage
→ ID: BRIK-ENG-0002
```

**Recommended:** Hybrid - use Feature-Slug if present, otherwise derive from filename

### 5. Title Extraction

Extract first # heading from markdown body:
```markdown
# Database-Backed Business OS (Cloudflare D1) — Plan
```
→ Title: "Database-Backed Business OS"

Fallback to Feature-Slug humanized:
```
Feature-Slug: brikette-translation-coverage
→ Title: "Brikette Translation Coverage"
```

### 6. Owner

**Default:** Pete (all plans created by or for Pete)

Post-migration: can reassign specific cards manually

---

## Gap Analysis

### Missing Required Fields

| Field | Coverage | Solution |
|-------|----------|----------|
| Lane | 0% | Derive from Status |
| Priority | 0% | Derive from Status or add to frontmatter |
| Owner | 0% | Default to "Pete" |
| ID | 34% (via Feature-Slug) | Generate from slug/filename |
| Title | ~60% (via # heading) | Extract or derive |
| Business | ~30% (via Domain) | Map Domain → Business |

### Recommended Pre-Migration Steps

**Option 1: Add fields to plan frontmatter (preferred)**
```yaml
# Add to all plans:
Priority: P1 | P2 | P3  # Manual or derived
Business: BOS | PLAT | BRIK | SKYL  # Derived from Domain
Card-ID: BRIK-ENG-0001  # Generated once
```

**Option 2: Migration script provides defaults**
- Script generates all missing fields
- Creates cards with best-effort mapping
- Accept that some manual cleanup will be needed post-migration

**Recommended:** Option 2 (faster, allows iteration)

---

## Conversion Script Design

### Input
- All `.md` files in `docs/plans/`
- Filter: `Status: Active | Draft | In Progress`

### Process
1. Read plan frontmatter + content
2. Derive missing card fields (Lane, Priority, Owner, ID, Business)
3. Extract Title from markdown heading
4. Validate against Card schema
5. Insert into D1 `business_os_cards` table
6. Create audit log entry

### Output
- Cards in D1 database
- Validation report (success/failures)
- ID mapping file (`plan-file → Card-ID`)

### Dry-Run Mode
- Validate all plans
- Show what would be created
- Report any unmappable plans
- Allow manual fixes before actual migration

---

## Migration Strategy

### Phase 1: Preparation (Manual, ~30 min)

1. **Audit plan files**
   - Run dry-run conversion
   - Identify plans missing critical fields
   - Fix any malformed frontmatter

2. **Add Business codes** (if not inferrable from Domain)
   - Review Domain → Business mapping
   - Add explicit `Business:` field to ambiguous plans

3. **Generate IDs**
   - Create ID sequence per business (BOS-ENG-0001, PLAT-ENG-0001, etc.)
   - Add `Card-ID:` to plan frontmatter OR let script generate

### Phase 2: Conversion Script (Automated, ~5 min)

```bash
# Create conversion script
apps/business-os/scripts/convert-plans-to-cards.ts

# Run in dry-run mode
pnpm tsx convert-plans-to-cards.ts --dry-run

# Review output, fix any issues

# Run actual migration
pnpm tsx convert-plans-to-cards.ts --commit
```

**Script responsibilities:**
- Parse plan frontmatter
- Derive card fields (Lane, Priority, ID, Business)
- Extract Title from markdown
- Insert into D1
- Create audit log entries
- Generate migration report

### Phase 3: Validation (Manual, ~15 min)

1. **Check D1 database**
   ```bash
   wrangler d1 execute BUSINESS_OS_DB --remote \
     --command "SELECT COUNT(*) FROM business_os_cards"
   ```

2. **View cards in UI**
   - Visit https://e4b2d615.business-os.pages.dev/boards/BRIK
   - Verify cards appear correctly
   - Check lanes, priorities, titles

3. **Test auto-refresh**
   - Create new card via UI
   - Verify it appears within 30s

4. **Verify git export**
   - Wait for hourly job (or trigger manually)
   - Check that exported markdown matches D1 content

---

## Going Forward: D1 Canonical + Git Mirror

### Source of Truth
**D1 is canonical** - all writes go to database first

### Git Mirror Purpose
- Audit trail (human-readable history)
- Manual inspection/editing (rare)
- Rollback capability (restore from git if needed)

### Workflow

**Normal operation:**
```
User edits card in UI
  ↓
Save to D1 (instant)
  ↓
Auto-refresh shows change (30s)
  ↓
Hourly git export runs (CI job)
  ↓
Git updated with D1 state
```

**Manual git edits** (emergency/bulk updates):
```
Edit docs/plans/*.md files
  ↓
Commit + push to main
  ↓
Run migration script manually
  ↓
D1 updated from git
  ↓
UI shows changes (30s auto-refresh)
```

**Recommendation:** Discourage manual git edits once D1 is populated. Use UI for all changes going forward.

---

## Risks & Mitigations

### Risk: ID Collisions
**Scenario:** Script generates duplicate IDs
**Mitigation:** Use deterministic ID generation + collision detection
**Fallback:** Manual ID assignment for conflicts

### Risk: Data Loss During Migration
**Scenario:** Migration fails, data corrupted
**Mitigation:** Run in dry-run mode first, backup D1 before migration
**Rollback:** Restore D1 from backup, re-run migration

### Risk: Ongoing Drift (Git vs D1)
**Scenario:** Users edit both git files and UI
**Mitigation:** Document that D1 is canonical, discourage git edits
**Detection:** Hourly export will overwrite git edits (makes drift visible)

### Risk: Missing Plan Context
**Scenario:** Cards lack full plan context (task lists, etc.)
**Mitigation:** Link card content to full plan file, or migrate task summaries to card content

---

## Open Questions

1. **Business codes:**
   - Confirm: BOS, PLAT, BRIK, SKYL?
   - Any others needed?

2. **Lane for "Proposed" status plans:**
   - Inbox? or Fact-finding?

3. **Priority assignment:**
   - Use Status-based defaults?
   - Or add explicit Priority to plan frontmatter first?

4. **ID generation:**
   - Auto-generate and add to plan frontmatter?
   - Or keep IDs only in D1 (not in plan files)?

5. **Plan task lists:**
   - Migrate as card content?
   - Or create separate stage docs for task details?

6. **Completed plans:**
   - Include in migration (Status: Complete → Lane: Done)?
   - Or skip and only migrate active work?

---

## Recommendation

**Proceed with migration:**

1. **Fact-find phase** (now):
   - Review this analysis
   - Answer open questions
   - Decide on mapping rules

2. **Plan phase:**
   - Design conversion script
   - Define schema enhancements (if any)
   - Create test plan

3. **Build phase:**
   - Implement conversion script
   - Run dry-run validation
   - Execute migration to D1
   - Verify in UI

4. **Go forward:**
   - D1 is canonical
   - Git export for audit
   - Discourage manual git edits

**Estimated effort:** 2-4 hours total (including testing)

---

## Success Criteria

- ✅ 43+ cards created in D1 (from Active/Draft plans)
- ✅ All cards visible in UI board views
- ✅ Cards have correct Lane, Priority, Business assignments
- ✅ Auto-refresh works (UI updates within 30s)
- ✅ Hourly git export creates markdown files in `docs/business-os/cards/`
- ✅ No data loss or corruption
- ✅ Migration is idempotent (can re-run safely)
