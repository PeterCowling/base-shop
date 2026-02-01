# Card Operations Helper

Shared helper for creating and managing Business OS cards. Use this when skills need to create cards as part of their workflow (e.g., `/fact-find` with Business-Unit, `/work-idea`).

## Card ID Format

**Format:** `<BUSINESS>-ENG-<SEQUENCE>`

- `BUSINESS`: Business unit code (BRIK, PLAT, PIPE, BOS)
- `ENG`: Card type (always "ENG" for engineering cards)
- `SEQUENCE`: 4-digit zero-padded number (e.g., 0001, 0002, ..., 0999, 1000)

**Examples:**
- `BRIK-ENG-0001` - First Brikette engineering card
- `PLAT-ENG-0023` - 23rd Platform engineering card
- `PIPE-ENG-0005` - 5th Pipeline engineering card

## ID Allocation (Scan-Based)

Skills use scan-based allocation to determine the next available ID. This avoids runtime dependencies and format mismatches.

### Algorithm

```
1. List all files in docs/business-os/cards/ matching pattern: <BUSINESS>-ENG-*.user.md
2. Extract the sequence numbers (last 4 digits before .user.md)
3. Find the maximum sequence number (or 0 if no cards exist)
4. Increment by 1
5. Format as <BUSINESS>-ENG-<PADDED_SEQUENCE>
```

### Example Bash Commands

```bash
# Find next ID for PLAT business
BUSINESS="PLAT"
MAX_ID=$(ls docs/business-os/cards/${BUSINESS}-ENG-*.user.md 2>/dev/null | \
  sed 's/.*-ENG-\([0-9]*\)\.user\.md/\1/' | \
  sort -n | \
  tail -1)
NEXT_ID=$(printf "%04d" $((${MAX_ID:-0} + 1)))
CARD_ID="${BUSINESS}-ENG-${NEXT_ID}"
echo "Next card ID: $CARD_ID"
```

## Card File Structure

Each card consists of **two files** (dual-audience pattern):

1. **`<ID>.user.md`** - Human-readable version
2. **`<ID>.agent.md`** - LLM-optimized version

Both files have identical frontmatter but different body content.

## Frontmatter Schema

```yaml
---
Type: Card
ID: <CARD-ID>                    # e.g., BRIK-ENG-0021
Lane: <LANE>                     # Inbox | Fact-finding | Planned | In progress | Blocked | Done | Reflected
Priority: <PRIORITY>             # P0 | P1 | P2 | P3 | P4 | P5 (default: P3)
Business: <BUSINESS>             # BRIK | PLAT | PIPE | BOS
Owner: <OWNER>                   # Person responsible (default: Pete in Phase 0)
Created: YYYY-MM-DD              # Creation date
Title: <TITLE>                   # Short title (max 100 chars)
# Optional fields
Updated: YYYY-MM-DD              # Last update date
Tags: [tag1, tag2]               # Categorization tags
Dependencies: [<ID1>, <ID2>]     # Blocking card IDs
Due-Date: YYYY-MM-DD             # Target completion date
Proposed-Lane: <LANE>            # Proposed lane transition (for review)
Plan-Link: <PATH>                # Link to plan document
Plan-Confidence: <%>             # Overall plan confidence
Last-Progress: YYYY-MM-DD        # Last progress update
---
```

## Card Body Templates

### User-Facing Card (.user.md)

```markdown
---
Type: Card
ID: {CARD-ID}
Lane: Fact-finding
Priority: P3
Business: {BUSINESS}
Owner: Pete
Created: {DATE}
Title: {TITLE}
---

# {TITLE}

## Description
{2-3 sentences describing the work}

## Value
- {Value point 1}
- {Value point 2}
- {Value point 3}

## Next Steps
1. {Next step 1}
2. {Next step 2}
3. {Next step 3}
```

### Agent-Facing Card (.agent.md)

```markdown
---
Type: Card
ID: {CARD-ID}
Lane: Fact-finding
Priority: P3
Business: {BUSINESS}
Owner: Pete
Created: {DATE}
Title: {TITLE}
---

## Card: {CARD-ID}

**Linked Artifacts:**
- Fact-find: `docs/plans/{feature-slug}-fact-find.md`
- Plan: `docs/plans/{feature-slug}-plan.md` (when created)

**Current Lane:** {LANE}

**Context for LLM:**
- {Relevant technical context}
- {Key decisions or constraints}
- {Dependencies or blockers}

**Transition Criteria:**
- {Current lane} -> {Next lane}: {Evidence required}
```

## Step-by-Step Card Creation

### 1. Determine Card ID

```bash
# Scan for next available ID
BUSINESS="PLAT"  # Replace with actual business
MAX_ID=$(ls docs/business-os/cards/${BUSINESS}-ENG-*.user.md 2>/dev/null | \
  sed 's/.*-ENG-\([0-9]*\)\.user\.md/\1/' | \
  sort -n | \
  tail -1)
NEXT_ID=$(printf "%04d" $((${MAX_ID:-0} + 1)))
CARD_ID="${BUSINESS}-ENG-${NEXT_ID}"
```

### 2. Create User-Facing Card

Create `docs/business-os/cards/{CARD-ID}.user.md` with the user-facing template.

### 3. Create Agent-Facing Card

Create `docs/business-os/cards/{CARD-ID}.agent.md` with the agent-facing template.

### 4. Create Card Directory

```bash
mkdir -p docs/business-os/cards/{CARD-ID}
```

### 5. Validate

```bash
pnpm docs:lint
```

## Idempotency

Before creating a new card, check if one already exists:

### Check by Card-ID

If `Card-ID` is provided in frontmatter:
```bash
if [ -f "docs/business-os/cards/${CARD_ID}.user.md" ]; then
  echo "Card already exists: ${CARD_ID}"
  # Skip card creation, proceed to stage doc
fi
```

### Check by Feature-Slug (Fallback)

If no `Card-ID` but `Feature-Slug` exists, scan for matching cards:
```bash
# Search for cards that reference this feature slug
rg -l "Feature-Slug: ${FEATURE_SLUG}" docs/business-os/cards/*.md
```

## Lane Transitions

Cards move through lanes based on evidence. See `/propose-lane-move` skill for transition criteria.

**Typical flow:**
1. **Inbox** - Initial card creation
2. **Fact-finding** - Gathering evidence (stage doc required)
3. **Planned** - Plan created with acceptance criteria (stage doc required)
4. **In progress** - Implementation underway (stage doc required)
5. **Done** - All acceptance criteria met
6. **Reflected** - Post-mortem complete

## Integration with Skills

### From /fact-find

When `/fact-find` completes with `Business-Unit` in frontmatter:
1. Allocate new Card-ID using scan-based approach
2. Create card with Lane: `Fact-finding`
3. Create fact-finding stage doc (see stage-doc-operations.md)
4. Add `Card-ID` to fact-find brief frontmatter

### From /plan-feature

When `/plan-feature` completes with `Card-ID` in frontmatter:
1. Update card with `Plan-Link` and `Plan-Confidence`
2. Create planned stage doc (see stage-doc-operations.md)
3. Suggest lane transition to `Planned`

### From /build-feature

When `/build-feature` works on tasks with `Card-ID`:
1. Update card `Last-Progress` after each task
2. Create build stage doc if first task (see stage-doc-operations.md)
3. Suggest lane transition to `Done` when all tasks complete

## Business Unit Codes

| Code | Business | Description |
|------|----------|-------------|
| BRIK | Brikette | Guide booking platform |
| PLAT | Platform | Shared infrastructure |
| PIPE | Pipeline | Product pipeline tools |
| BOS | Business OS | Internal tools |

## Related Resources

- Stage doc creation: `.claude/skills/_shared/stage-doc-operations.md`
- Lane transitions: `.claude/skills/propose-lane-move/SKILL.md`
- Card types reference: `apps/business-os/src/lib/types.ts`
- Example card: `docs/business-os/cards/BRIK-ENG-0020.user.md`
