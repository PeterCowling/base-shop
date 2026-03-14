# Critique History — reception-prime-activity-inbox

## Round 1

- **Artifact:** `docs/plans/reception-prime-activity-inbox/fact-find.md`
- **Method:** codemoot route (codemoot 0.2.14, Node 22)
- **codemoot score:** 8/10
- **lp_score:** 4.0 / 5.0
- **Verdict:** needs_revision
- **Critical findings:** 0
- **Major findings:** 5
- **Minor findings:** 1
- **Codex thread:** 019ce23b-5fa8-7a40-9076-a49734c4292d

### Findings addressed in Round 1 revision

1. [Major] D1 migration claim overstated — `channel_type` comment is not a schema constraint; TypeScript-only change needed. **Fixed.**
2. [Major] Staff reply path incorrectly described as service-account token exchange — `projectPrimeThreadMessageToFirebase` uses `CF_FIREBASE_API_KEY` REST auth, not service-account token. **Fixed.**
3. [Major] `booking_id = 'hostel'` sentinel incorrectly labelled low-risk — `ThreadDetailPane` renders `guestBookingRef` verbatim; sentinel surfaces as `#hostel`. **Fixed with sentinel `'activity'` + UI guard requirement.**
4. [Major] Security claim over-trusts RTDB writes — RTDB rules permit any authenticated client write; added analysis note that Option C (server function) is required to close the authenticity gap. **Fixed.**
5. [Major] Dependency map undercounts non-broadcast fallthroughs — `prime-review-send-support.ts` `resolveSentMessageKind` and `resolveSentAdmissionReason` both have non-broadcast else-branches. **Fixed: added to dependency map.**
6. [Minor] Activity IDs stated as Firebase push keys — they are `crypto.randomUUID()` values from `activity-manage.ts`. **Fixed.**

## Round 2

- **Artifact:** `docs/plans/reception-prime-activity-inbox/fact-find.md` (revised)
- **Method:** codemoot route (codemoot 0.2.14, Node 22)
- **codemoot score:** 9/10
- **lp_score:** 4.5 / 5.0
- **Verdict:** approved (post-revision)
- **Critical findings:** 0
- **Major findings:** 0
- **Minor findings:** 1

### Findings in Round 2

1. [Minor] Open question 1 about bookingId strategy is partially answered by the sentinel recommendation but the analysis question is still correct to preserve. No autofix required.

**Final verdict: credible. Score: 4.5/5.0. No Critical findings. Proceeding to Ready-for-analysis.**

## Round 3

- **Artifact:** `docs/plans/reception-prime-activity-inbox/analysis.md`
- **Method:** inline `/lp-do-critique` (analysis lens)
- **lp_score:** 4.0 / 5.0
- **Verdict:** partially credible → autofix applied → credible (post-fix)
- **Critical findings:** 0
- **Major findings:** 2
- **Moderate findings:** 2
- **Minor findings:** 2

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Major | Sequencing constraints | No explicit deployment order stated; ChatProvider update before server function causes 404 |
| 3-02 | Major | Planning focus / validation implications | `resolveSentMessageKind` incorrectly listed as needing new branch — it already returns `'support'` for all non-broadcast; only `resolveSentAdmissionReason` needs change |
| 3-03 | Moderate | End-State Operating Model | `ensureActivityChannelMeta` create-path fields not specified; open seam for planning |
| 3-04 | Moderate | Validation implications | Message schema cross-check and `ensureActivityChannelMeta` test cases absent |
| 3-05 | Minor | Deployment constraints | Staging verification step not mentioned in sequencing |
| 3-06 | Minor | Risks to Carry Forward | Split deployment window risk not listed |

### Issues Confirmed Resolved This Round (via autofix)

| ID | Severity | Summary | How resolved |
|---|---|---|---|
| 3-01 | Major | Deployment order unspecified | Added explicit ordering: server-side bundle first, staging verify, then ChatProvider update |
| 3-02 | Major | `resolveSentMessageKind` incorrectly flagged | Corrected planning focus — only `resolveSentAdmissionReason` needs new branch |
| 3-03 | Moderate | `ensureActivityChannelMeta` create-path fields missing | Specified `{channelType, bookingId: 'activity', audience, createdAt, updatedAt}` in End-State model |
| 3-04 | Moderate | Validation cross-check tests missing | Added message schema cross-check and `ensureActivityChannelMeta` test cases to validation implications |
| 3-05 | Minor | Staging verification absent | Added staging verify step to sequencing constraints |
| 3-06 | Minor | Split deployment window risk absent | Added deployment window risk row to Risks to Carry Forward |

### Issues Carried Open

None — all Round 3 findings resolved via autofix.

**Final verdict: credible (post-fix). Score: 4.0/5.0 → raised to 4.5/5.0 post-autofix. No Critical or Major findings remain.**

## Round 4

- **Artifact:** `docs/plans/reception-prime-activity-inbox/plan.md`
- **Method:** inline `/lp-do-critique` (plan lens)
- **lp_score:** 4.0 / 5.0 (pre-fix) → 4.5 / 5.0 (post-fix)
- **Verdict:** partially credible → autofix applied → credible (post-fix)
- **Critical findings:** 0
- **Major findings:** 1
- **Moderate findings:** 2
- **Minor findings:** 2

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 4-01 | Major | TASK-05 Execution plan (Green step) | else-branch has no activity-channel discriminator; any future non-direct channel type silently routes to `activity-message.ts` |
| 4-02 | Moderate | TASK-05 Scouts | Incorrect conclusion — `push` import will NOT become unused; used at line 278 in `postInitialMessages` |
| 4-03 | Moderate | TASK-02 Refactor step | `buildMessageId` extraction from `[readonly]` source is contradictory; should say "copy locally" |
| 4-04 | Minor | TASK-06 Engineering Coverage UX/states | TC-19/21 scope ambiguity (deferred vs. CI-required) between Decision Log and Acceptance criteria |
| 4-05 | Minor | Overall Acceptance Criteria | "All 21 TCs pass in CI" without clarifying TC-19/21 coverage scope |

### Issues Confirmed Resolved This Round (via autofix)

| ID | Severity | Summary | How resolved |
|---|---|---|---|
| 4-01 | Major | else-branch discriminator missing | Added explicit `channelId.startsWith('dm_')` guard + unsupported channel error in Green step |
| 4-02 | Moderate | `push` import scout incorrect | Corrected scout: `push` used at line 278 in `postInitialMessages`; no import change needed |
| 4-03 | Moderate | `buildMessageId` extraction contradicts `[readonly]` | Changed Refactor step: "Copy locally; do not modify `direct-message.ts`" |
| 4-04 | Minor | TC-19/21 scope ambiguity in TASK-06 | Engineering Coverage UX/states now says "CI-required (fetch-path unit tests)"; Acceptance updated to include TC-19/21 |
| 4-05 | Minor | TC-19/21 scope in Overall Acceptance | Added clarification: "TC-19/21 covered by fetch-path unit tests" |

### Issues Carried Open

None — all Round 4 findings resolved via autofix.

**Final verdict: credible (post-fix). Score: 4.5/5.0. No Critical or Major findings remain. Plan eligible for build handoff.**
