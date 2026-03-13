# Domain: Data Hardening

**Goal**: Verify the app's data handling is type-safe and defensively validated before launch.
**Required output schema**: `{ domain: "data-hardening", status: "pass|fail|warn", checks: [{ id: "<DH-X>", status: "pass|fail|warn", evidence: "<string>" }] }`

## Invocation

This domain module delegates to `/lp-do-data-audit`. It does not perform its own grep-level scanning — it invokes the canonical audit skill and translates its verdict into the domain output schema.

**Step 1 — Resolve app path:**

Read the site baseline (`docs/business-os/site-upgrades/<BIZ>/latest.user.md`) to find the app path (the monorepo directory of the app being audited, e.g., `apps/caryina`). If the baseline does not specify an app path, use the directory matching the business code in `apps/`.

**Step 2 — Run the data hardening audit:**

```
/lp-do-data-audit <app-path>
```

Await completion. The audit produces a report at `docs/audits/data-hardening/<app-name>-<YYYY-MM-DD>.md`.

**Step 3 — Read audit verdict:**

Read the report frontmatter: `Verdict`, `Critical`, `High`, `Medium`, `Low`.

**Step 4 — Translate to domain check results:**

Map the 7 audit categories (CAT-01 through CAT-07) to check IDs DH-01 through DH-07:

| Check ID | Audit Category | Description |
|---|---|---|
| DH-01 | CAT-01 | Schema validation coverage (API route inputs) |
| DH-02 | CAT-02 | TypeScript strictness (tsconfig + as-any patterns) |
| DH-03 | CAT-03 | Environment variable schema validation |
| DH-04 | CAT-04 | Prisma / database type safety |
| DH-05 | CAT-05 | Client-side response validation |
| DH-06 | CAT-06 | Error handling (catch typing, sanitization) |
| DH-07 | CAT-07 | Unsafe cast patterns |

For each check:
- `status: fail` if any CRITICAL or HIGH finding exists in that category
- `status: warn` if only MEDIUM or LOW findings exist in that category
- `status: pass` if no findings in that category

**Step 5 — Determine domain status:**

- `status: fail` if any check is `status: fail` (i.e., CRITICAL or HIGH finding in any category)
- `status: warn` if no fails but at least one `status: warn` check
- `status: pass` if all checks pass

**Step 6 — Return domain result:**

```json
{
  "domain": "data-hardening",
  "status": "pass|fail|warn",
  "audit_report_ref": "docs/audits/data-hardening/<app-name>-<YYYY-MM-DD>.md",
  "finding_counts": { "critical": N, "high": N, "medium": N, "low": N },
  "checks": [
    { "id": "DH-01", "status": "pass|fail|warn", "evidence": "<summary from audit report for CAT-01>" },
    { "id": "DH-02", "status": "pass|fail|warn", "evidence": "<summary from audit report for CAT-02>" },
    { "id": "DH-03", "status": "pass|fail|warn", "evidence": "<summary from audit report for CAT-03>" },
    { "id": "DH-04", "status": "pass|fail|warn", "evidence": "<summary from audit report for CAT-04>" },
    { "id": "DH-05", "status": "pass|fail|warn", "evidence": "<summary from audit report for CAT-05>" },
    { "id": "DH-06", "status": "pass|fail|warn", "evidence": "<summary from audit report for CAT-06>" },
    { "id": "DH-07", "status": "pass|fail|warn", "evidence": "<summary from audit report for CAT-07>" }
  ]
}
```

## Domain Pass Criteria

| Check | Fail triggers domain fail? | Warn condition |
|---|---|---|
| DH-01 (Schema validation) | Yes — CRITICAL or HIGH finding | MEDIUM or LOW finding only |
| DH-02 (TS strictness) | Yes — CRITICAL or HIGH finding | MEDIUM or LOW finding only |
| DH-03 (Env vars) | Yes — CRITICAL or HIGH finding | MEDIUM or LOW finding only |
| DH-04 (Prisma safety) | Yes — CRITICAL or HIGH finding | MEDIUM or LOW finding only (or N/A if no Prisma) |
| DH-05 (Client validation) | Yes — CRITICAL or HIGH finding | MEDIUM or LOW finding only |
| DH-06 (Error handling) | Yes — CRITICAL or HIGH finding | MEDIUM or LOW finding only |
| DH-07 (Unsafe casts) | Yes — CRITICAL or HIGH finding | MEDIUM or LOW finding only |

- Domain `status: fail` → **blocks launch** (same severity as Security domain fail)
- Domain `status: warn` → non-blocking; findings documented in QA report for follow-up
- If `/lp-do-data-audit` cannot run (app path not found, scan error): domain `status: fail` with evidence `"audit could not complete: <reason>"` — failure to audit is treated as a fail
