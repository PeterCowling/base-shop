# Critique History: prime-guest-ghost-mode

## Round 1 — 2026-03-14

lp_score: 3.5 (codemoot score: 7/10)
Verdict: partially credible

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Evidence Audit — Policy enforcement section | Claimed `canSendDirectMessage` changes "propagate to both layers automatically" — false; `isVisibleInDirectory` is a separate function in `GuestDirectory.tsx` that requires an independent update |
| 1-02 | Major | Suggested Task Seeds / Testing | `useFetchGuestProfile.effectiveProfile` explicit spread produces `undefined` for missing `ghostMode`, not safe `false`; `ghostMode: data.ghostMode ?? false` required explicitly |
| 1-03 | Major | Engineering Coverage Matrix / Testing | Testing matrix cited `useGuestProfiles.test.tsx` as covering `effectiveProfile` — wrong seam; that test covers directory profiles, not the `useFetchGuestProfile` hook |
| 1-04 | Major | Suggested Task Seeds | No mention of `apps/prime/functions/__tests__/direct-message.test.ts` — the authoritative server-gate test that must receive a ghost mode 403 test case |
| 1-05 | Major | Questions — Open | UI placement question marked Open but already decided by scope (GuestProfileForm, per evidence in scope section) |

### Issues Confirmed Resolved This Round

None (Round 1 — no prior issues).

### Issues Carried Open

None.

---

## Round 2 — 2026-03-14

lp_score: 4.0 (codemoot score: 8/10)
Verdict: credible

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | Engineering Coverage Matrix / Testing row | Still overstated: "messaging policy, directory, and form" — no `GuestProfileForm` test file exists today; nearest is `ChatOptInControls` which tests a different component |
| 2-02 | Major | Suggested Task Seeds — TASK-03 | `chat-optin-controls.test.tsx` tests a different component; TASK-03 must specify creation of new `GuestProfileForm.test.tsx` |
| 2-03 | Major | Suggested Task Seeds / Evidence Audit | Server test path cited incorrectly as `apps/prime/functions/api/__tests__/direct-message.test.ts`; correct path is `apps/prime/functions/__tests__/direct-message.test.ts` |
| 2-04 | Moderate | Confidence Inputs | Implementation and Delivery-Readiness sections still reference UI placement as an unresolved operator question despite Questions section having no open questions |
| 2-05 | Info | Impact confidence | `activity-message.ts` noted as uncertain DM path needing CHECKPOINT investigation — confirmed to be hostel-wide broadcast channel sender, not a DM path; uncertainty is unnecessary |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Major | `isVisibleInDirectory` not mentioned as independent update | Added explicit note that both `canSendDirectMessage` and `isVisibleInDirectory` must be updated independently |
| 1-02 | Major | `undefined` vs `false` in effectiveProfile spread | Added explicit `ghostMode: data.ghostMode ?? false` requirement to TASK-01 seed and Evidence Audit |
| 1-03 | Major | Wrong test seam in testing matrix | Testing matrix updated to clarify no `useFetchGuestProfile.effectiveProfile` test exists; `useGuestProfiles.test.tsx` covers directory only |
| 1-04 | Major | Missing server integration test | `apps/prime/functions/__tests__/direct-message.test.ts` added to Recommended Test Approach |
| 1-05 | Major | Open question contradicts scope | Moved UI placement question to Resolved with evidence from scope section |

### Issues Carried Open

None — all Round 2 findings addressed in autofix.

---

## Round 3 (Analysis) — 2026-03-14

lp_score: 4.0 (analysis artifact, Round 1 for this document)
Verdict: credible

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| A1-01 | Moderate | End-State Operating Model — Firebase rules row | "Must deploy simultaneously with type change" is wrong anchor; should be TASK-03 (form toggle), not TASK-01 (type change) |
| A1-02 | Moderate | Planning Handoff — task sequence + sequencing constraints | TASK-05 presented as linear final step after TASK-04; contradicts co-commit constraint stated in same section |
| A1-03 | Minor | Engineering Coverage Comparison — Testing row | Does not flag that GuestProfileForm.test.tsx must be created from scratch (captured in Planning Handoff, not blocking) |
| A1-04 | Minor | Options Considered | No explicit elimination of D1/server-side storage as option; constrained by fact-find but not referenced here |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| — | — | (No prior analysis critique rounds) | — |

### Issues Carried Open

None — all Round 3 findings addressed in autofix.

---

## Round 4 (Plan) — 2026-03-14

lp_score: 4.5 (plan artifact, Round 1 for this document)
Verdict: credible

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| P1-01 | Moderate | TASK-02 Execution Plan + Notes | Ghost check documented as "the first check" but actual parameter types are `GuestProfile | null | undefined`; placing check before null guard causes TypeScript error; must be after null guard |
| P1-02 | Moderate | TASK-04 Affects list | TC-09 (`effectiveProfile` ghost mode default) has no host file; `useFetchGuestProfile.test.ts` absent from Affects list |
| P1-03 | Minor | Decision Log | Refers to "TASK-05 (Firebase rules) folded into TASK-03" — no TASK-05 exists in this plan; wording could confuse build executor |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| — | — | (No prior plan critique rounds) | — |

### Issues Carried Open

None — all Round 4 findings addressed in autofix.
