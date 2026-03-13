# Critique History: prime-owner-dashboard-pipeline

## Round 1

**Route:** codemoot
**Artifact:** `docs/plans/prime-owner-dashboard-pipeline/fact-find.md`
**Raw output:** `docs/plans/prime-owner-dashboard-pipeline/critique-raw-output.json`

**Score (codemoot):** 6/10 → lp_score: 3.0
**Verdict:** needs_revision
**Severity counts:** Critical: 1 | Major (warning): 3 | Minor (info): 1

### Findings

**Critical:**
- Line 49: The brief's core raw-data model does not match the live Prime RTDB layout. `aggregateDailyKpis()` assumed `bookings/{bookingId}/occupants/{uuid}/preArrival` etc., but actual signals are at `preArrival/{uuid}`, `checkInCodes/byUuid/{uuid}`, `checkins/{date}/{uuid}`, `primeRequests/byGuest/{uuid}`, `bagStorage/{uuid}`.

**Major (warnings):**
- Line 238: Auth assumption was not supportable — `CF_FIREBASE_API_KEY` is an Identity Toolkit key; repo already has `firebase-custom-token.ts` for the correct path. Section revised to treat auth as unresolved.
- Line 190: `checkInDate` index state was stated as "not confirmed" but `database.rules.json` definitively shows only `start_time` and `occupants` indexed. Corrected to confirmed-absent.
- Line 113: "All existing Pages Functions are GET endpoints" was factually wrong. POST functions exist (check-in-code, extension-request, bag-drop-request, staff-auth-session). Corrected.

### Autofixes Applied

All 4 findings addressed in artifact revision:
1. Critical: Added RTDB topology section to Current Process Map; updated Data & Contracts with real 6-path schema; updated Engineering Coverage Matrix (Data/contracts, Security, Performance rows); added RTDB schema mismatch as top risk; revised Suggested Task Seeds.
2. Auth warning: Updated Security coverage row; revised auth constraint language; updated auth risk from Medium to High.
3. Index warning: Updated "checkInDate not indexed" from "not confirmed" to "confirmed absent" in Data & Contracts, Evidence Gap Review, and Risks table.
4. GET-only pattern warning: Corrected Patterns & Conventions section to accurately describe the existing POST function pattern.

### Round 2 Condition

Score was 3.0 (partially credible). Critical finding was present → Round 2 required.

---

## Round 2

**Route:** inline (lp-do-critique)
**Artifact:** `docs/plans/prime-owner-dashboard-pipeline/fact-find.md` (revised)

**Assessment:**
After autofixes, the critical finding (RTDB schema mismatch) is now fully documented and reflected in constraints, data/contracts, coverage matrix, risks, and task seeds. All three major findings are corrected. Confidence scores have been revised down to reflect the higher complexity revealed. The fact-find now accurately represents the actual pipeline gap, including the non-trivial multi-path projection required for the writer.

The RTDB topology section, the corrected auth path, and the updated risk register provide sufficient evidence for analysis to proceed. No remaining critical findings.

**lp_score: 4.0**
**Verdict:** credible
**Severity counts:** Critical: 0 | Major: 0 | Minor: 1 (remaining assumption on `roomsByDate` enumeration — acceptable for fact-find stage, flags for analysis)

### Post-Loop Gate

lp_score 4.0, no Critical findings remaining → proceed to completion.

**Final verdict:** credible
**Final lp_score: 4.0/5.0**
