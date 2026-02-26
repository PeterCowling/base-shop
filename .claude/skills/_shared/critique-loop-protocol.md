# Critique Loop Protocol (Shared)

Used by `lp-do-fact-find` (Phase 7a, fact-find mode) and `lp-do-plan` (Phase 9, plan mode).

## Pre-Critique Factcheck Gate

Before Round 1, evaluate whether `/lp-do-factcheck` should run. Run it if the artifact contains:
- Specific file paths or module names stated as facts
- Function names/signatures, API behavior, or interface claims
- Test coverage assertions

> **Fact-find mode:** Also check for architecture descriptions referencing actual code structure. Skip factcheck if the artifact is purely business/hypothesis-based with no codebase claims.

> **Plan mode:** Items also include "Test coverage or CI behavior assertions". This check may run before Round 1 or between rounds if critique surfaces factual claim issues — use judgment on timing.

## Critique Route Selection

Before starting each round, resolve the codemoot path:

```
CODEMOOT="$(nvm exec 22 which codemoot 2>/dev/null | tail -1)"
```

If `CODEMOOT` resolves to a non-empty path: use **codemoot route** (see below).
If `CODEMOOT` is empty (nvm unavailable, Node 22 not installed, or codemoot not installed): use **inline route** (fallback, `/lp-do-critique`).

**Prerequisites for codemoot route (one-time setup):**
1. Install codemoot: `nvm exec 22 npm install -g @codemoot/cli`
2. Install Codex CLI: `nvm exec 22 npm install -g @openai/codex`
3. Init project config: `nvm exec 22 codemoot init --non-interactive` (creates `.cowork.yml` and `.cowork/` — both gitignored)
4. Verify auth: run `nvm exec 22 codex login status` → should show "Logged in using ChatGPT"

**codemoot route — score mapping:**
- Run: `"$CODEMOOT" review <artifact>` (stdout is JSON; no `--json` flag needed)
- Parse: `score` (integer 0–10, or null), `verdict` ("approved"|"needs_revision"|"unknown"), `findings` (array of `{severity, file, line, message}`)
- Map to lp_score: `lp_score = codemoot_score / 2` (e.g. 8/10 → lp_score 4.0; 4/10 → lp_score 2.0)
- Null guard: if `score` is null, fall back to inline route for this round with a warning note.
- **Score takes precedence over verdict** for all gate decisions. Verdict field is advisory context only.
- Translate findings to critique format: `severity: critical` → Critical finding; `severity: warning` → Major finding; `severity: info` → Minor finding.
- Log raw JSON output to `docs/plans/<slug>/critique-raw-output.json` (overwrite per round for latest evidence).
- Pass `findings[]` array (and `review` string as supplemental context) to the autofix phase (AF-1 through AF-4) as the fix list.

**inline route (fallback):**
- Invoke `/lp-do-critique` as normal.
- Record score (0–5 scale, no mapping needed) and severity counts directly.

## Iteration Rules

Run critique at least once and up to three times:

| After round | Condition to run next round |
|---|---|
| Round 1 | Any Critical finding, OR 2+ Major findings |
| Round 2 | Any Critical finding still present |
| Round 3 | Final round — always the last regardless of outcome |

Before each round after the first: revise the artifact to address prior-round findings, then re-run.

**Round 1 (mandatory — always runs)**
1. Invoke critique (codemoot route or inline fallback per above):
   - Fact-find mode: `docs/plans/<slug>/fact-find.md` (CRITIQUE + AUTOFIX)
   - Plan mode: `docs/plans/<slug>/plan.md` (CRITIQUE + AUTOFIX, scope: full)
2. Record: round number, lp_score, severity counts (Critical / Major / Minor).
3. Apply the round 2 condition above.

**Round 2 (conditional — any Critical, or 2+ Major in Round 1)**
1. Revise the artifact to address Round 1 findings.
2. Re-invoke critique. Record results. Apply the round 3 condition.

**Round 3 (conditional — any Critical still present after Round 2)**
1. Revise the artifact to address Round 2 findings.
2. Re-invoke critique. Record results. Final round — do not loop further.

## Post-Loop Gate

**Fact-find mode:**
- `credible` (3.6–3.9 or score ≥ 4.0), no Critical remaining → proceed to completion.
- `partially credible` (2.6–2.9 or 3.0–3.5) OR Critical remain after final round → set `Status: Needs-input`, surface top findings, stop. Do not route to planning.
- `not credible` (score ≤ 2.5) → evaluate recoverability: Recoverable → `Needs-input`; Structural → `Infeasible` + `## Kill Rationale`.

**Plan mode:**
- `not credible` (score ≤ 2.5) → set `Status: Draft`, block auto-build, recommend `/lp-do-replan`.
- `partially credible` (2.6–2.9 or 3.0–3.5): `plan+auto` → proceed with `Critique-Warning: partially-credible`; `plan-only` → stop, recommend `/lp-do-replan`.
- `credible` (3.6–3.9 or score ≥ 4.0) → proceed normally.
- Ordering: runs after Phase 8 (persist), before Phase 10 (build handoff). Re-evaluate build eligibility after autofixes.

## Idempotency (Fact-Find Mode Only)

Critique creates/updates `docs/plans/<slug>/critique-history.md`. Multiple rounds append to the same ledger — expected, does not require user approval.
