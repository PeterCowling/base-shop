---
name: improve-guide
description: Run audit-guide-seo.ts for a guide URL, iteratively fix all audit issues in EN, then propagate updated copy to all locales
---

# Guide SEO Audit + Fix + Localization (Batch-Capable, Locale-Safe, Reader-First)

## Core commitments (non-negotiable)

**Batch is user-directed.**
You must ask which guide or group of guides to process. If the user provides a URL that implies a single guide but says "batch," you must still ask how to define the batch (keys, slugs, folder, or manifest selection).

**Every write is validated immediately.**
After each file write, validate JSON parseability and token integrity before doing anything else.

If validation fails, the only allowed fix is replacement with known-good content.

- Restore the file from a known-good snapshot taken immediately before the edit, or from git restore / git checkout -- <path>.
- Then re-apply the intended change safely (prefer structured JSON editing).
- No other fix is valid. No "surgery" on corrupted text, no partial patching, no "we'll fix later."

**No delaying for convenience.**
Do not accumulate multiple edits and validate later. Validation is stepwise and immediate.

**If a timely replacement cannot be made, stop and ask the user what they want to do.**
This is the only acceptable fallback.

**Readership-first ordering is required.**
Reorder content so the reader can decide/act quickly, with explicit early-content gates (defined below).

**Localization must not assume sync.**
Non-EN locale content may have drifted. You must check and reconcile the entire locale content, not only the strings changed in EN.

---

## Operating Mode

**READ + PLAN BATCH + SNAPSHOT + RUN (SCRIPT) + EDIT (EN JSON, VALIDATE EACH WRITE) + RE-RUN (UNTIL CLEAN) + LOCALIZE (PARALLEL, DRIFT-AWARE, VALIDATE EACH LOCALE WRITE) + REPORT**

**Translation Policy (Non-Negotiable):**
- **Always complete all translation work in-house.** Never ask about engaging professional translators or offloading translation work to external services.
- **Always use parallel subagents for localization.** Spawn multiple Task tool subagents to translate locales concurrently, maximizing speed.
- **Never defer or skip localization.** All 17 non-EN locales must be updated for every guide processed.

---

## Allowed

- Ask user to specify a single guide or a batch definition (see Inputs)
- Read/parse guide references (URL/slug/guideKey list)
- Read guide manifest data to map slug(s) → guideKey(s)
- Run apps/brikette/scripts/audit-guide-seo.ts (EN locale only)
- Read/modify EN guide JSON:
  - apps/brikette/src/locales/en/guides/content/{guideKey}.json
- Update audit results in:
  - apps/brikette/src/data/guides/guide-manifest-overrides.json
- Update non-EN locale guide JSON files to match updated EN meaning, preserving tokens exactly
- **Spawn parallel Task tool subagents for concurrent locale translation** (required for all localization work)
- Web research for fact verification + finding usable images (as needed)
- Write original prose (no copying copyrighted text)

---

## Not Allowed

- Third-party SEO tools/APIs (Semrush, Ahrefs, Screaming Frog, etc.)
- Changes outside the target guides except where strictly required by the audit
- Changing link targets in localization (only translate visible anchor text)
- Translating or altering any "preserve exactly" tokens
- Deferring validation/fixing "until later"
- Any remediation for corrupted JSON other than replacement with known-good content
- **Asking about professional translators or external translation services** (forbidden)
- **Suggesting to defer/skip localization or offload translation work** (forbidden)
- **Sequential locale processing when parallel is possible** (forbidden - always use Task tool for parallel translation)

---

## Inputs

### Required (batch selection)

You must obtain one of the following from the user:

**Single guide reference**
- Full URL (preferred), e.g. http://localhost:3012/en/experiences/gavitella-beach-guide
- Or a slug, e.g. gavitella-beach-guide
- Or a guideKey, e.g. gavitellaBeachGuide

**Batch selection**
- A list of URLs/slugs/guideKeys
- A manifest-driven selection rule, e.g.:
  - "all guides under /experiences"
  - "all beach guides"
  - "these 12 slugs…"
- A repo/path-driven selection rule (only if your repo actually supports it), e.g.:
  - "all guide JSONs in apps/brikette/src/locales/en/guides/content/ that match prefix X"

**Hard requirement:**
If the user does not explicitly specify the guide(s), you must ask:

> "Which guide or group of guides should we cover?"

### Optional (but recommended)

- Readership/audience (ask after the first audit results are known, per guide or for the batch)
- Tone constraints + must-include details (accessibility, costs, transport, safety, crowds, seasonality)

> **Note:** All auditing + fixing is performed in EN regardless of locale in the URL.

---

## Pre-step: Ask About Readership (Required)

After the first audit results are known, ask:

- Intended readership?
- Tone constraints?
- Must-include details (accessibility, costs, transport, safety, crowds, seasonality)?

**Batch behavior:**
- If the batch is homogeneous (e.g., "beach guides"), you may ask for one shared readership profile to apply to all, and allow exceptions if the user specifies.
- If the batch is mixed (e.g., beaches + directions + attractions), ask whether to apply a common readership or specify per category.
- If the user doesn't respond, assume: general travelers + practical "how to go / what to expect."

---

## Script of Record

Audit logic is exactly:

- `apps/brikette/scripts/audit-guide-seo.ts`

This script is the source of truth for: score, issues, improvements.

---

## Validation & Replacement Protocol (applies to every write)

### A. Snapshot before every edit (mandatory)

Before modifying any JSON file:

1. Read the full file contents into memory as the known-good snapshot.
2. Ensure you can restore it immediately if needed.

Recommended additional safety:
- Keep a second snapshot from git (if available) as the "absolute known-good."

### B. Validate immediately after every write (mandatory)

For any file you write (EN guide JSON, locale guide JSON, manifest overrides JSON), run:

**JSON parse check (hard gate)**
- Must parse as valid JSON (UTF-8).
- If it fails → restore snapshot immediately.

**Token preservation check (hard gate)**
Preserve exactly:
- `%LINK:target|anchor%` → only anchor may change; target must remain identical
- `%IMAGE:path%` unchanged
- `%COMPONENT:name%` unchanged
- URLs, paths, IDs, technical tokens

If broken/missing/unexpected changes → restore snapshot immediately.

**Structure parity check (hard gate for localization)**
For each locale file after update:
- Same sections order and count as EN
- Same number of intro paragraphs
- Same FAQ count and ordering
- Same gallery structure

If mismatch → restore snapshot immediately.

### C. Only permitted remedy for failed validation

1. Replace corrupted content with the known-good snapshot (or git restore).
2. Re-apply the intended change using structured JSON editing.
3. If repeated failure and you cannot produce a clean write promptly → stop and ask user what to do.

**No other fix is valid.**

---

## Readership-first ordering gates (mandatory)

The guide must communicate essentials early. Apply this in EN, then preserve equivalent structure in all locales.

### Default early-content window

Target first ~250–350 words. Choose the smallest number that fully communicates essentials for that guide type.

### Guide-type specific gates

**Directions / "how to get there" guides**

Within first ~300 words:
- Starting point(s) and destination
- Best default route + alternatives (walk/transit/taxi/car)
- Typical time range(s)
- Approx cost expectations (if relevant)
- One or two "gotchas" (stairs, last service, reservations, weather exposure)

**Beach guides**

Within first ~250–300 words:
- Who it's best for / not for (kids, mobility, budget, crowds)
- Access difficulty (stairs, distance, transport)
- Facilities snapshot (toilets, showers, shade, rentals)
- Costs (free vs lido fees; parking; rentals if known)
- Best time to go + one safety note if relevant

**Attractions / POIs**

Within first ~250–300 words:
- Why go + time needed
- Access and booking/queues
- Cost expectations (if relevant)
- One or two key gotchas

**Food/drink venues**

Within first ~250–300 words:
- What it is + price band
- Booking necessity
- Dietary constraints baseline
- Best use case (sunset, quick bite, special occasion)

**Implementation requirement:**
If current content buries these essentials, reorder and rewrite so these appear early—without breaking audit requirements.

---

## Batch Workflow

### 0) Ask for guide(s) to process (mandatory)

If the user has not clearly provided:
- a single guide, or
- a list/batch definition,

you must ask:

> "Which guide or group of guides should we cover?"

Acceptable answers include:
- 1 URL
- list of URLs/slugs/guideKeys
- "all under /experiences"
- "all beach guides"
- "these 10 slugs…"

### 1) Resolve batch → ordered guideKey list

For each input item:
- If URL/slug: map to guideKey via manifest
- Validate EN file exists for each guideKey
- Produce a deterministic processing order:
  - Prefer user-specified order, else:
  - category grouping (directions first if travel-critical), then alphabetical.

**Stop-the-line rule:**
If any guide cannot be resolved, report which item failed and ask user how to proceed (skip, fix input, or stop).

### 2) Baseline validation pass for the entire batch (mandatory)

Before modifying any guide in the batch:

For every target file you may touch:
- EN guide JSON for each guideKey
- Locale JSONs for each guideKey (all locales you intend to update)
- guide-manifest-overrides.json

Validate:
- JSON parses cleanly
- Token inventory can be computed

If any file is corrupted:
- Replace corrupted content with known-good content immediately.
- If you cannot restore promptly, stop and ask user what they want to do (e.g., skip affected guide/locale, or stop batch).
- No proceeding with SEO fixes while corruption exists.

### 3) Per-guide EN audit + iterative fix loop (one guide at a time)

For each guideKey in the batch:

**Run initial audit:**
```bash
pnpm --filter brikette tsx scripts/audit-guide-seo.ts {guideKey}
```

Read audit output from overrides JSON

**Apply EN fixes iteratively:**
- Use structured JSON editing (load → modify → stringify)
- After each EN write:
  - snapshot exists
  - validate parse + token integrity
- Enforce readership-first ordering gates
- Re-run audit after each iteration until clean:
  - score ≥ 9.0
  - zero critical issues
  - zero improvements

**Stop-the-line:**
- If any write fails validation, restore snapshot immediately and redo safely.
- If you cannot produce a timely clean write, stop and ask the user what to do.

### 4) Per-guide localization to all locales (parallel execution via Task tool, drift-aware)

After EN is clean for that guide:

**Required: Spawn parallel translation subagents**

Use the Task tool to spawn multiple parallel subagents for concurrent locale translation. **Never translate sequentially.**

Target locales: [ar, da, de, es, fr, hi, hu, it, ja, ko, no, pl, pt, ru, sv, vi, zh] (17 total)

**Recommended parallelization strategy:**
- Spawn 4-6 subagents in a single Task tool call (one message with multiple tool uses)
- Each subagent handles 3-4 locales
- Example grouping:
  - Agent 1: ar, da, de, es
  - Agent 2: fr, hi, hu, it
  - Agent 3: ja, ko, no, pl
  - Agent 4: pt, ru, sv, vi, zh

**Per-locale translation workflow (each subagent executes these steps):**

1. Parse existing locale file (baseline validate)
   - If parse fails: restore known-good content immediately; if not possible promptly, stop and ask user.

2. Drift check (required):
   - Compare locale's structure and coverage vs EN:
     - missing/extra sections
     - ordering differences
     - FAQ mismatches
     - stale content elsewhere

3. Update locale comprehensively to match EN meaning and structure:
   - preserve tokens exactly
   - keep link targets unchanged (translate anchor only)

4. Write locale file → validate immediately:
   - JSON parse
   - token preservation
   - structure parity vs EN

5. If validation fails:
   - restore snapshot immediately
   - redo localization safely
   - if still not possible promptly, stop and ask user what they want to do

**After all parallel subagents complete:**
- Verify all 17 locales were successfully updated
- Report any locale-specific issues encountered
- Confirm validation passed for all locales

### 5) Completion report (batch-aware)

At end, report:

**For the batch:**
- Guides processed (count + list)
- Any guides skipped (with reasons)

**Aggregate:**
- initial vs final scores (per guide)
- audit iterations per guide
- locales updated per guide (confirm all 17 locales updated via parallel subagents)
- parallel translation efficiency (number of subagents spawned, total translation time)
- any locale exceptions (must be user-approved)

**For each guide:**
- Initial score → final score
- Key issue categories fixed
- Reader-first improvements made (what the first ~300 words now cover)
- Confirmation that:
  - every write was validated immediately
  - any corruption was handled only by replacement with known-good content
  - all 17 non-EN locales were successfully updated via parallel subagents
  - no translation work was deferred or suggested for external handling

---

## Localization Rules (enforced by validation)

**Preserve Exactly (Never Translate):**
- `%LINK:target|anchor%` → translate anchor only; preserve target exactly
- `%IMAGE:path%` unchanged
- `%COMPONENT:name%` unchanged
- URLs, paths, IDs, technical tokens

**Translate Naturally:**
- Titles, body, FAQs
- Section headings
- Meta titles/descriptions
- Image alt text (if present)

**Match Structure:**
- Same section order + counts
- Same number of intro paragraphs
- Same FAQ count and ordering
- Same gallery structure

**Locale-appropriate phrasing:**
- Maintain existing formality level unless clearly inconsistent or incorrect

---

## Quality Gates (must pass before "complete")

**Per guide:**
1. Final audit score ≥ 9.0
2. Zero critical issues
3. Zero improvements
4. EN JSON valid + tokens preserved
5. Overrides JSON valid

**Per locale:**
6. Locale JSON valid
7. Tokens preserved correctly
8. Structure parity vs EN
9. Drift addressed (not just "changed EN strings")

**Batch-level:**
10. No unresolved corruption remains anywhere in the touched files
11. Any skipped guide/locale is explicitly documented and user-approved

---

## Error Handling (replacement-only)

**JSON corruption detected**
- Restore file from known-good snapshot (or git restore) immediately.
- Re-apply intended change safely via structured JSON editing.
- If cannot restore promptly → stop and ask user what they want to do.

**Audit script fails**
- Validate guide-manifest-overrides.json and the target EN guide JSON parse cleanly; restore if corrupted.
- Verify script path exists and dependencies installed.
- Re-run.

---

## Practical implementation note (to avoid non-EN corruption)

Edits should be applied by:
1. loading JSON,
2. modifying only string fields,
3. serializing with `JSON.stringify(obj, null, 2)` + newline.

Avoid manual text patching in non-EN locales. This reduces risk of invalid quotes, delimiter issues, and encoding damage.
