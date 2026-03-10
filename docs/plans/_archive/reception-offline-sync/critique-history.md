# Critique History — reception-offline-sync

## Plan Round 1
- **Score**: 5/10 → lp_score 2.5 (not credible)
- **Critical**: 1 | **Major**: 3 | **Minor**: 2
- **Critical finding**: TASK-03 gateway pattern unsafe for hooks with post-write side effects — `useActivitiesMutations.addActivity` calls `maybeSendEmailGuest` (requires Firebase `get` + email service, network-dependent); `useLoansMutations.removeLoanItem`/`convertKeycardDocToCash` chain into `logActivity` + `addToAllTransactions` (other hooks, cannot be serialized). Early return before side effects creates financial/audit divergence.
- **Major findings**: (1) Idempotency claim incorrect — plan stated `idempotencyKey` prevents duplicate records but v1 sync does not implement dedup logic; (2) OfflineSyncContext contradictory — one section says throw when context missing, another says safe default; (3) TASK-08 validation used local Jest command, violating AGENTS.md:93 ("Tests run in CI only")
- **Action**: Fixed all — TASK-03 scoped to write-only ops; `removeLastActivity` and most `useLoansMutations` methods marked online-only; `maybeSendEmailGuest` deferral documented in Decision Log; idempotency claim clarified (keys stored v1, dedup logic v2); OfflineSyncContext unified to safe-default-only; TASK-08 uses CI validation; Login.tsx (incorrectly cited) removed from consumers list

## Plan Round 2 (final)
- **Score**: 7/10 → lp_score 3.5 (partially credible — final round)
- **Critical**: 0 | **Major**: 2 | **Minor**: 1
- **Major findings**: (1) `Login.tsx` incorrectly cited as useOnlineStatus consumer — only `OfflineIndicator.tsx` confirmed; (2) Overall acceptance criteria said "loan ops are queued" — mismatched with TASK-03 scope (saveLoan only, others online-only)
- **Minor findings**: Why: TBD in outcome contract — acceptable for auto-sourced dispatch
- **Action (autofixes applied)**: Login.tsx removed from consumers list; acceptance criteria updated to specify saveLoan queued + read-before-write ops show online-only error; Why: TBD noted as carry-through
- **Final verdict**: Partially credible after Round 2 autofixes. No Critical findings in either round. All substantive scope decisions verified against source files. Score trajectory 5→7 confirms convergence. Proceeding with Critique-Warning: partially-credible per plan+auto protocol.
