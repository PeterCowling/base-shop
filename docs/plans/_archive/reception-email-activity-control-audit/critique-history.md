# Critique History: reception-email-activity-control-audit

## Round 1 — 2026-02-27 (prior session, no ledger file written)

> Note: Round 1 critique was run in the prior session before context compaction. Issues documented from session summary; no ledger file was written at that time.

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Critical | TASK-03 Execution Plan | Wrong function: `handleGuestEmailActivity(gmail, {...})` does not exist; correct function is `sendGuestEmailActivity({bookingRef, activityCode, recipients})` with no `gmail` param |
| 1-02 | Critical | TASK-03 Execution Plan | Wrong Firebase path: `GET /guestsByBooking/{occupantId}` — email is at `/guestsDetails/{bookingRef}/{occupantId}.email` not `/guestsByBooking/` |
| 1-03 | Critical | TASK-04 Planning Validation | `emailResult.status === "error"` claimed dead code — actually valid via `SendEmailGuestResult` wrapper in `useEmailGuest.ts` |
| 1-04 | Minor | TASK-02 + TASK-03 Notes | FIREBASE_DATABASE_URL cited at line ~1546; actual line is 1886 |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Critical | Wrong function name/signature | TASK-03 execution plan, approach, notes all updated to `sendGuestEmailActivity` |
| 1-02 | Critical | Wrong Firebase path | TASK-03 updated throughout to `/guestsDetails/{reservationCode}` single-call approach |
| 1-03 | Critical | "error" status dead code | TASK-04 planning validation updated with type clarification: `SendEmailGuestResult` (wrapper) has `status: "error"` even though MCP-level `GuestEmailActivityResult` does not |
| 1-04 | Minor | Line number citation | All references to "~1546" updated to "~1886" |

---

## Round 2 — 2026-02-27

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Critical | TASK-03 Execution Plan + Affects | Circular import: `sendGuestEmailActivity` in `guest-email-activity.ts:11` imports from `gmail.ts`; adding reverse import creates `gmail.ts → guest-email-activity.ts → gmail.ts` cycle |
| 2-02 | Moderate | TASK-02 Execution Plan step 3 | `/bookings/{reservationCode}` response shape undocumented; build agent must guess `Object.keys(response)` for occupant IDs |
| 2-03 | Moderate | TASK-03 Execution Plan step 3 | Null guard for `/guestsDetails/` GET response not stated; Firebase returns `null` for absent node, not empty object |
| 2-04 | Moderate | TASK-04 Execution Plan | `setError` stable-reference note absent; ESLint exhaustive-deps might flag missing dep array entry |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Critical | Circular import | Execution plan step 0 added: redirect `guest-email-activity.ts` import from `./gmail.js` to `./gmail-shared.js`; `guest-email-activity.ts` added to Affects; Risks section updated |
| 2-02 | Moderate | Booking response shape | Added "response is `{[occupantId]: any}` — use `Object.keys(response)`" to TASK-02 execution plan step 3 |
| 2-03 | Moderate | Null guard | TASK-03 execution plan step 3 updated: "If response is null, skip draft loop silently" |
| 2-04 | Moderate | setError dep array | TASK-04 execution plan Green updated with stable-reference note |

### Issues Carried Open (not yet resolved)
None.
