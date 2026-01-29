---
name: work-idea
description: Convert a raw idea from inbox to a worked idea with card and initial Fact-finding stage doc.
---

# Work Idea

Transform a raw idea from the inbox into a worked idea with proper structure, create a corresponding card, and initialize the Fact-finding stage document. This skill bridges the idea→card workflow in Business OS.

## Operating Mode

**READ + WRITE (CREATE ONLY)**

**Allowed:**
- Read raw idea from `docs/business-os/ideas/inbox/`
- Create worked idea in `docs/business-os/ideas/worked/`
- Create card in `docs/business-os/cards/`
- Create initial Fact-finding stage doc
- Run `pnpm docs:lint` for validation

**Not allowed:**
- Modifying existing cards (use `/propose-lane-move` for lane changes)
- Creating cards without working up the idea first
- Skipping required frontmatter fields

## Inputs

**Required:**
- Idea ID (e.g., `BRIK-OPP-0001`) or idea filename in inbox

**Optional:**
- Owner override (default: Pete for Phase 0)
- Business override (if idea doesn't specify or specifies incorrectly)

## Worked Idea Quality Rubric

A "worked up" idea must have:

### Required Fields
- **Business:** Valid business code (BRIK, SKYL, PLAT, etc.)
- **Owner:** Person responsible (default: Pete in Phase 0)
- **Title:** Clear, specific title (≤100 chars)
- **Description:** At least 3 sentences explaining:
  - What is the opportunity?
  - What is the potential impact/value?
  - What is the proposed approach (high-level)?
- **Status:** "Worked" (moved from "raw")
- **Card-ID:** Link to created card

### Scope Clarity
- 1-sentence summary of opportunity
- Impact/value statement (qualitative or quantitative)
- Clear success criteria or "done" definition

### Completeness Check
- All required frontmatter fields from BOS-07 validation rules
- Description is substantive (not placeholder text)
- Business context is clear (which product/service affected)

## Workflow

### 1. Read Raw Idea

```typescript
const reader = createRepoReader(repoRoot);
const idea = await reader.getIdea(ideaId);

if (!idea || idea.Status !== "raw") {
  throw new Error("Idea must exist and have Status: raw");
}
```

### 2. Analyze and Clarify

**Extract/infer business code:**
- Check idea frontmatter `Business` field
- If missing, infer from content (mentions of Brikette, Skyline, etc.)
- If unclear, ask Pete which business this applies to

**Clarify scope:**
- Read description and extract core opportunity
- Identify value/impact (user benefit, revenue, cost savings, etc.)
- Propose high-level approach if not already clear
- Add assumptions if scope is uncertain

**Assign owner:**
- Phase 0: Default to Pete
- Phase 1+: Use idea submitter or infer from business team

### 3. Generate Worked Idea

Create two files:

**`docs/business-os/ideas/worked/{ideaId}.user.md`** (human-readable):
```markdown
---
Type: Idea
ID: BRIK-OPP-0001
Business: BRIK
Owner: Pete
Status: Worked
Card-ID: BRIK-ENG-0001
Created-Date: 2026-01-28
Last-Updated: 2026-01-28
---

# Add user authentication to guide booking flow

## Summary
Enable users to save their guide preferences and booking history by adding authentication to the Brikette guide booking flow.

## Opportunity
Currently, users must re-enter their information for each guide booking. This creates friction and reduces conversion rates. Adding authentication would:
- Reduce booking abandonment (estimated 15-20% improvement)
- Enable personalized guide recommendations
- Support repeat bookings and loyalty features

## Proposed Approach
1. Integrate existing platform auth system (used in CMS)
2. Add optional "Save my info" checkbox during first booking
3. Create user profile page showing booking history
4. Phase 1: read-only profile; Phase 2: enable rebooking

## Success Criteria
- Users can create account during booking flow
- Returning users auto-fill booking forms
- Booking completion rate increases by ≥10%

## Assumptions
- Platform auth system supports Brikette integration
- No GDPR concerns (booking data already stored)
- Users want this feature (validate with user research)
```

**`docs/business-os/ideas/worked/{ideaId}.agent.md`** (LLM-optimized):
```markdown
---
Type: Idea
ID: BRIK-OPP-0001
Business: BRIK
Owner: Pete
Status: Worked
Card-ID: BRIK-ENG-0001
Created-Date: 2026-01-28
Last-Updated: 2026-01-28
---

## Idea: Add user authentication to guide booking flow

**Business Context:**
- Product: Brikette (guide booking platform)
- Current state: Anonymous booking flow, no user accounts
- Pain point: Users re-enter information every booking, high abandonment

**Value Proposition:**
- Reduce booking abandonment 15-20% (estimated)
- Enable personalization (guide recommendations based on history)
- Support loyalty features (repeat bookings, saved preferences)

**Technical Approach:**
- Reuse platform auth from `packages/platform-core/src/auth/`
- Minimal UI: optional account creation, auto-fill on return
- Data model: extend existing user schema, add booking history table
- Integration points: checkout flow, user profile page

**Evidence Needed (Fact-finding phase):**
- User research: do users want accounts? (survey or interviews)
- Platform auth integration effort: check compatibility with Brikette
- Compliance check: GDPR implications of storing booking history
- Performance: auth overhead on booking flow

**Dependencies:**
- Platform auth system (already exists, needs compatibility check)
- Database migration for booking history schema
- No blocking dependencies on other cards

**Risks:**
- Users may not want accounts (validate early)
- Auth complexity may slow booking flow (measure performance)
- Privacy concerns if not handled correctly (legal review)

**Success Metrics:**
- Booking completion rate: +10% (baseline: measure current rate)
- Repeat booking rate: +25% (new metric)
- User account creation rate: ≥30% of first-time bookers
```

### 4. Create Card

**`docs/business-os/cards/{cardId}.user.md`**:
```markdown
---
Type: Card
ID: BRIK-ENG-0001
Lane: Inbox
Priority: P3
Business: BRIK
Owner: Pete
Created: 2026-01-28
Title: Add user authentication to guide booking flow
---

# Add user authentication to guide booking flow

## Description
Enable users to save preferences and booking history by adding authentication to Brikette's guide booking flow. Reduces friction and supports personalization features.

## Value
- Reduce booking abandonment 15-20%
- Enable personalized guide recommendations
- Support loyalty features (repeat bookings)

## Next Steps
1. Move to Fact-finding lane
2. Run user research (do users want accounts?)
3. Check platform auth compatibility with Brikette
4. Create plan if findings are positive
```

**`docs/business-os/cards/{cardId}.agent.md`**:
```markdown
---
Type: Card
ID: BRIK-ENG-0001
Lane: Inbox
Priority: P3
Business: BRIK
Owner: Pete
Created: 2026-01-28
Title: Add user authentication to guide booking flow
---

## Card: BRIK-ENG-0001

**Linked Idea:** `docs/business-os/ideas/worked/BRIK-OPP-0001.user.md`

**Current Lane:** Inbox

**Fact-Finding Required:**
- User research: validate demand for accounts
- Platform auth integration effort estimation
- GDPR/compliance review
- Performance impact measurement

**Evidence to Gather:**
- Customer-input: user surveys or interviews
- Repo-diff: examine platform auth code for compatibility
- Measurement: baseline booking completion rate
- Legal: GDPR compliance confirmation

**Transition Criteria:**
- Fact-finding complete → Planned (requires positive user research + confirmed technical feasibility)
- Planned → In progress (requires plan doc with acceptance criteria)
```

### 5. Create Initial Fact-Finding Stage Doc

**`docs/business-os/cards/{cardId}/fact-finding.user.md`**:
```markdown
---
Type: Stage-Doc
Card-ID: BRIK-ENG-0001
Stage: Fact-finding
Created: 2026-01-28
Owner: Pete
---

# Fact-Finding: Add user authentication to guide booking flow

## Questions to Answer

1. **User demand:** Do users want account functionality?
   - Method: Survey 100 recent bookers
   - Evidence type: customer-input
   - Target date: TBD

2. **Technical feasibility:** Can platform auth integrate with Brikette?
   - Method: Code review of `packages/platform-core/src/auth/`
   - Evidence type: repo-diff
   - Target date: TBD

3. **Compliance:** Any GDPR concerns with storing booking history?
   - Method: Legal review with compliance team
   - Evidence type: legal
   - Target date: TBD

4. **Performance:** Will auth slow down booking flow?
   - Method: Measure baseline, estimate auth overhead
   - Evidence type: measurement
   - Target date: TBD

## Findings

_To be completed during Fact-finding phase_

## Recommendations

_To be completed based on findings_
```

### 6. Validate

```bash
pnpm docs:lint
```

Ensure all created files pass validation (required headers, valid enum values, etc.).

### 7. Commit Changes

```typescript
const writer = createRepoWriter(repoRoot);

// Move idea to worked (git mv)
// Create card files
// Create stage doc
// Commit with agent identity

await writer.updateIdea(ideaId, { Status: "Worked", "Card-ID": cardId });
await writer.writeCard({ ...cardData }, CommitIdentities.agent);
await writer.writeStageDoc(cardId, "fact-finding", stageDocData, CommitIdentities.agent);
```

Commit message:
```
Work up idea: {ideaId} → Card: {cardId}

- Move idea to worked/
- Create card in Inbox lane
- Create initial Fact-finding stage doc
```

## Edge Cases

### Idea is already worked up
- Check if Card-ID already exists
- If yes, skip and return existing card ID
- If no, create card from existing worked idea

### Business code missing or invalid
- Ask Pete which business this applies to
- Do not guess or default without confirmation

### Scope is too vague
- Ask clarifying questions before creating card
- Example: "Does 'improve performance' mean client-side or server-side?"
- Do not create card with placeholder descriptions

### Multiple ideas for same opportunity
- Ask Pete if these should be combined or kept separate
- Check for duplicate cards before creating new one

## Integration with Other Skills

- After creating card, recommend `/propose-lane-move` to move to Fact-finding lane
- Use `/scan-repo` to gather technical evidence during Fact-finding
- Use `/fact-find` skill for structured fact-finding approach (if available)

## Example Session

```
User: /work-idea BRIK-OPP-0001

Agent:
I'll work up idea BRIK-OPP-0001.

[Reads raw idea]
- Business: BRIK (confirmed)
- Title: "User auth for booking"
- Description: Brief, needs expansion

[Clarifying questions]
Q: Should this support social login (Google/Facebook) or just email/password?
Pete: Email/password for Phase 1, social login later

Q: Is this optional or required for all bookings?
Pete: Optional - users can still book anonymously

[Working up idea]
- Expanded description with 3 parts: opportunity, impact, approach
- Added success criteria: 10% booking completion improvement
- Added assumptions: platform auth compatible, no GDPR blockers

[Creating files]
✓ docs/business-os/ideas/worked/BRIK-OPP-0001.user.md
✓ docs/business-os/ideas/worked/BRIK-OPP-0001.agent.md
✓ docs/business-os/cards/BRIK-ENG-0001.user.md
✓ docs/business-os/cards/BRIK-ENG-0001.agent.md
✓ docs/business-os/cards/BRIK-ENG-0001/fact-finding.user.md

[Validating]
✓ pnpm docs:lint passed

[Committing with agent identity]
✓ Commit: Work up idea: BRIK-OPP-0001 → Card: BRIK-ENG-0001

Done! Card created: BRIK-ENG-0001 (Inbox lane)
Next step: /propose-lane-move BRIK-ENG-0001 to move to Fact-finding
```

## Success Metrics

- Card creation rate: <5 minutes per idea (agent-assisted)
- Validation pass rate: 100% (all cards pass docs:lint before commit)
- Rework rate: <10% (cards need clarification after creation)
- Idea→Card conversion: ≥80% of worked ideas become viable cards

## Phase 0 Constraints

- Pete-supervised (all agent runs are Pete-triggered, not autonomous)
- Agent identity for all commits
- No automated idea scanning (Pete submits ideas manually or via `/scan-repo`)
- Single business board view (global board shows P0/P1 only)
