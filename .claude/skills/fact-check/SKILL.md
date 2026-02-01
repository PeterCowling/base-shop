---
name: fact-check
description: Verify the accuracy of statements in markdown documents by auditing the actual repository state. Documentation-to-repo conformance audit that checks documentation against current repo reality.
---

# Fact Check

Verify the accuracy of statements in markdown documents by auditing the actual repository state. Produces an audit report showing which claims are accurate, which are inaccurate/outdated, and which cannot be verified.

## Key Distinction: fact-check vs fact-find

| Aspect | `/fact-find` | `/fact-check` |
|--------|-------------|---------------|
| Direction | Forward-looking | Documentation-to-repo conformance |
| Purpose | Gather evidence BEFORE planning | Verify existing documentation |
| Input | Topic/feature to investigate | Path to a markdown document |
| Output | Planning brief or system briefing | Audit report with findings |
| When | Before creating a plan | After documentation exists |

**fact-find:** "What do we need to know to build this?"
**fact-check:** "Is what we wrote still true?"

## Operating Mode

**READ + VERIFY + REPORT**

**Allowed:**
- Read the target document
- Search the repository (glob, grep, file reads)
- Inspect tests, configs, and code
- Check dependency versions in package.json/lockfiles
- Review git history for file existence/changes
- Produce an audit report
- **Create a new audit report file** in `docs/audits/` or the document's directory (new file only)

**Not allowed:**
- Modifying the audited document (user decides what to fix)
- Editing existing files (except creating the new audit report)
- Making code changes
- Creating commits
- Fixing inaccuracies automatically
- Classification without explicit evidence pointer

## Repo Anchor Requirement

Every audit must record what state of the repository was audited:

**Preferred:** `Audit-Ref: <commit SHA>` - Use the current HEAD commit SHA
**Alternative:** `Audit-Ref: working-tree` - Use if uncommitted changes exist in relevant files

To determine the anchor:
1. Run `git rev-parse HEAD` to get current commit SHA
2. Run `git status` to check for uncommitted changes in files relevant to the audit
3. If relevant files have uncommitted changes, use `working-tree` with a warning in the report

**Warning format for working-tree audits:**
> ⚠️ This audit was performed against the working tree, which contains uncommitted changes. Results may differ from the committed state.

## Inputs

**Required:**
- Path to the markdown document to verify (e.g., `docs/plans/feature-plan.md`, `README.md`, `docs/architecture.md`)

**Optional:**
- Scope: `focused` or `full` (see Scope Definitions below)
- Verbosity: `summary`, `detailed` (default), or `detailed+appendix`

## Scope Definitions

| Scope | Categories Included | Notes |
|-------|---------------------|-------|
| `focused` | 1–3 only | Only when tied to concrete file/module references |
| `full` | 1–6 | Complete audit of all claim categories |

**Explicit scope knobs** (for fine-grained control):
- `scope.include: [paths, exports, deps, counts, behavior, architecture]`

**Stop condition for large documents:**
If a `full` audit identifies >200 claims:
- Verify all Category 1–3 claims exhaustively
- Sample Category 4–6 claims (at least 20% or 10 claims, whichever is greater)
- Note in report: "Large document mode: sampled categories 4–6"
- User can explicitly request exhaustive audit to override

## Claim Categories

When reading the document, identify and categorize claims:

### Category 1: File/Directory References
- Explicit paths: "The component is at `src/components/Button.tsx`"
- Directory claims: "Tests live in `__tests__/`"
- Config references: "See `tsconfig.json` for..."

### Category 2: Code Structure Claims
- Component existence: "The `UserProfile` component handles..."
- Function existence: "Call `validateInput()` to..."
- Export claims: "This module exports `useAuth`"
- Pattern claims: "Uses the repository pattern"

### Category 3: Technology/Dependency Claims
- Version claims: "Built with React 19"
- Dependency claims: "Uses Prisma for ORM"
- Stack claims: "Runs on Cloudflare Pages"

### Category 4: Architecture Claims
- Data flow: "Requests go through the API gateway"
- Integration claims: "Connects to PostgreSQL"
- Layer claims: "Three-tier architecture"

### Category 5: Behavioral Claims
- Feature existence: "Supports dark mode"
- API claims: "The `/api/users` endpoint returns..."
- Test coverage claims: "Has 80% test coverage"

### Category 6: Count/Quantity Claims
- "Contains 3 packages"
- "Has 15 API endpoints"
- "Supports 12 languages"

## Atomic Claim Rules

**One claim = one verifiable predicate.** Each claim must assert a single, testable fact.

Examples of atomic claims:
- "File X exists"
- "Function Y is exported from module Z"
- "React major version is 19"
- "Directory `src/utils/` contains validation helpers"

**Compound sentences must be split:**

| Document Text | Atomic Claims |
|---------------|---------------|
| "The `useAuth` hook in `src/hooks/` handles authentication and session management" | C1: `useAuth` hook exists in `src/hooks/` <br> C2: `useAuth` handles authentication <br> C3: `useAuth` handles session management |

**Claim Ledger (mandatory):**
Maintain an internal ledger during audit. This ensures consistent counting and traceability:

```
Claim ID | Doc Line(s) | Category | Claim (atomic) | Status
---------|-------------|----------|----------------|--------
C01      | 15          | 1        | File `src/config.ts` exists | Accurate
C02      | 15          | 2        | `config.ts` exports `appConfig` | Accurate
C03      | 23-24       | 3        | React version is 19 | Inaccurate
```

The ledger need not appear in full in the final report, but totals must be derivable from it.

## Exclusion Rules: Examples vs Claims

**Decision rule for ambiguous content:**

If a path, code snippet, or technical reference appears:
- Under a heading containing "Example", "Sample", "Pseudo-code", "Sketch", "Template", or "Illustration"
- Within a block explicitly marked as hypothetical
- In a "could look like" or "might be" context

**→ Treat as non-claim by default.**

**Exception:** If surrounding text explicitly asserts repo truth, treat as claim:
- "In this repo, it lives at..."
- "Our actual implementation..."
- "Currently located at..."

When in doubt, mark as a claim but note the ambiguity in findings.

## Workflow

### 1) Establish audit anchor

Before reading the document:
1. Run `git rev-parse HEAD` to get commit SHA
2. Check `git status` for uncommitted changes in relevant paths
3. Record anchor in report metadata

### 2) Parse the document

Read the target document and extract all verifiable claims. For each claim, record in the Claim Ledger:
- **Claim ID:** Sequential identifier (C01, C02, ...)
- **Doc line(s):** Line number(s) using stable method (equivalent to `nl -ba` output)
- **Category:** 1–6 per taxonomy above
- **Claim text:** The atomic claim extracted
- **What evidence would verify it**

### 3) Prioritize claims

Audit claims in this priority order:
1. File/directory references (easy to verify, high impact if wrong)
2. Code structure claims (moderate effort, high impact)
3. Technology/dependency claims (check package.json/lockfile)
4. Count/quantity claims (can be verified with tooling)
5. Architecture/behavioral claims (require deeper inspection)

### 4) Audit each claim

For each claim:

**a) Determine verification method:**
- File exists? → `glob`, `read`
- Code contains X? → `grep`, `read`
- Version correct? → Read `package.json` or lockfile
- Count accurate? → Run appropriate glob/count
- Structure matches? → Read and inspect

**b) Gather evidence:**
- Record exact file path checked
- Record line numbers: `<file-path>:<start-line>-<end-line>` or `<file-path>:<line>`
- Quote relevant code snippets (keep brief, max ~10 lines)
- Note commit SHA if version-sensitive

**c) Classify finding:**

| Finding | Criteria | Evidence Required |
|---------|----------|-------------------|
| Accurate | Evidence confirms the claim exactly | Path verified, code snippet, version string |
| Partially accurate | Claim is mostly true but details differ | Both confirming and contradicting evidence |
| Inaccurate | Claim contradicts current repo state | Exact contradiction with path/line citation |
| Outdated | Claim was true but repo has changed | **Git history evidence required** (see below) |
| Unverifiable | Claim too vague or refers to external/runtime state | Explanation of why verification impossible |

### 5) Record discrepancies

For inaccurate/outdated claims, document:
- **Documented state:** What the doc says
- **Actual state:** What the repo shows
- **Evidence:** File path, line number, code snippet
- **Severity:** High (blocking/misleading), Medium (confusing), Low (minor)

### 6) Generate audit report

Produce a structured report using the template below.

## Evidence Standards (Hard Requirements)

### Required for "Accurate" classification:
- File path verified to exist (for path claims)
- Code snippet confirming structure (for code claims)
- Version string from package.json (for version claims)
- Actual count with method shown (for quantity claims)

### Required for "Inaccurate" classification:
- Exact quote from document (the claim)
- Exact evidence from repo (the contradiction)
- Both must be cited with paths/line numbers

### Required for "Outdated" classification:

**Outdated requires git history evidence.** You must prove the claim was previously true:
- `git log --follow <path>` showing rename/move/removal
- A past commit where the referenced symbol/path existed
- `git show <sha>:<path>` demonstrating prior state

**If you cannot prove prior truth, classify as Inaccurate, not Outdated.**

Example git evidence for Outdated:
```
git log --oneline --follow -- src/old-path.ts
a1b2c3d Rename old-path.ts to new-path.ts
```

### Required for "Unverifiable" classification:
- Explanation of what would be needed to verify
- Classification of why it's unverifiable:
  - External dependency behavior
  - Runtime-only behavior (requires execution)
  - Deployment/infrastructure state
  - Too vague to form testable predicate
  - Requires manual testing

### Not acceptable:
- "Probably accurate" without verification
- "Likely outdated" without checking repo
- Assumptions based on conventions
- Memory of previous state
- Classification without explicit evidence pointer

## Verification Thresholds by Category

### Category 1: Path Claims
- **Evidence:** File/directory exists at specified path
- **If claim implies content:** File must contain referenced symbol

### Category 2: Export Claims
- **Evidence:** Show export statement
- **Plus:** Import usage OR re-export chain demonstrating accessibility

### Category 3: Dependency Claims
- **For "uses X":** Package appears in dependencies
- **For "version X":**
  - Accept if package.json major version matches (range OK)
  - If lockfile available, verify resolution for main app packages
  - If multiple versions resolve: mark **Partially accurate** with note: "repo uses X vN, but some packages resolve vM"

### Category 4 & 5: Architecture/Behavioral Claims
A claim can be **Accurate** only if:
1. Direct code evidence exists (feature flag, provider usage, middleware application), AND
2. Coverage exists in tests OR explicit contract code, OR
3. The claim is trivially derivable from implementation (e.g., "uses React" when React imports exist throughout)

**Otherwise:** Mark as **Unverifiable** with note: "requires runtime validation/manual test"

### Category 6: Count Claims
- **Evidence:** Show counting method
- **Include exclusions:** e.g., "counted `packages/*/package.json`, excluding `node_modules` and build outputs"
- **For approximate claims** ("about 15"): Accurate if within 10%

## Evidence Log (Required)

Every audit report must include a reproducible evidence log:

```markdown
## Evidence Log

### Files Opened
- `package.json` (dependency verification)
- `src/hooks/useAuth.ts` (export verification)
- `tsconfig.json` (config claims)

### Search Patterns Used
- `glob: "src/**/*.tsx"` → 47 files
- `grep: "export.*useAuth"` → 3 matches in `src/hooks/`

### Commands/Queries
- `git rev-parse HEAD` → `abc123def`
- `git log --follow -- src/old-utils.ts` → renamed in commit `xyz789`

### Package Files Checked
- `package.json` (root)
- `apps/web/package.json`
- `pnpm-lock.yaml` (version resolution)
```

## Audit Report Template

```markdown
---
Type: Fact-Check Audit
Document: <path to audited document>
Audit-Ref: <commit SHA or "working-tree">
Repo-Root: <absolute path to repo root>
Audit-Date: YYYY-MM-DD
Auditor: Agent
Method: <tools used: glob/grep/read/git>
Status: Complete | Partial (scope-limited)
---

# Fact-Check Audit: <Document Name>

## Summary

| Metric | Count |
|--------|-------|
| Total claims identified | N |
| Total claims checked | N |
| Accurate | N |
| Partially accurate | N |
| Inaccurate | N |
| Outdated | N |
| Unverifiable | N |

**Accuracy rate:** X% (Accurate / (Total checked - Unverifiable))

**Severity breakdown:**
- High severity issues: N
- Medium severity issues: N
- Low severity issues: N

## Issues (Inaccurate / Outdated / Partially Accurate)

### FC-01: <Short description>
- **Claim ID:** C03
- **Line:** N
- **Category:** N
- **Document says:** "<exact quote>"
- **Actual state:** "<what repo shows>"
- **Evidence:** `path/to/file:lineNumber`
- **Git evidence (if Outdated):** `<commit sha and description>`
- **Severity:** High/Medium/Low
- **Suggested fix:** "<how to correct the doc>"

### FC-02: ...

## Unverifiable Claims

| Claim ID | Line | Claim | Reason |
|----------|------|-------|--------|
| C15 | 45 | "Supports dark mode" | Runtime behavior; no test coverage found |
| C22 | 78 | "API returns within 200ms" | Performance claim; requires runtime measurement |

## Accurate Claims Summary

**By Category:**
- Category 1 (Paths): N accurate
- Category 2 (Code Structure): N accurate
- Category 3 (Dependencies): N accurate
- Category 4 (Architecture): N accurate
- Category 5 (Behavioral): N accurate
- Category 6 (Counts): N accurate

**High-Impact Accurate Claims (sample):**
- C01 (L5): "`src/index.ts` exists" - Verified
- C07 (L12): "React 19" - Verified: `"react": "^19.0.0"`
- C14 (L34): "Exports `useAuth`" - Verified: `src/hooks/useAuth.ts:15`

<details>
<summary>Full Accurate Claims List (N claims)</summary>

[Only include if verbosity is `detailed+appendix`]

| Claim ID | Line | Category | Claim | Evidence |
|----------|------|----------|-------|----------|
| C01 | 5 | 1 | File `src/index.ts` exists | File found |
| ... | | | | |

</details>

## Recommendations

### High Priority (fix before publishing/sharing)
1. FC-01: <specific action>
2. FC-02: <specific action>

### Medium Priority (fix when updating document)
3. FC-03: <specific action>

### Low Priority (nice to have)
4. FC-04: <specific action>

## Evidence Log

### Files Opened
- <list>

### Search Patterns Used
- <pattern> → <result summary>

### Git Commands
- <command> → <result summary>

### Package Files Checked
- <list>

## Audit Metadata

- **Scope:** full | focused
- **Verbosity:** summary | detailed | detailed+appendix
- **Time spent:** ~N minutes
- **Large doc mode:** Yes/No (if >200 claims)
- **Sampling note:** [if applicable] Categories 4–6 sampled at N%
```

## Output Defaults by Verbosity

| Verbosity | Issues | Unverifiable | Accurate |
|-----------|--------|--------------|----------|
| `summary` | Counts only | Counts only | Counts only |
| `detailed` (default) | Full detail | Full table | Summary + sample |
| `detailed+appendix` | Full detail | Full table | Full appendix |

## Examples of Claims to Check

### Example 1: Path Reference
**Document says:** "Configuration is in `config/settings.json`"
**Check:** glob for the file
**Possible findings:**
- Accurate: File exists at that path
- Inaccurate: File is actually at `src/config/settings.json`
- Outdated: File was renamed to `config/app-settings.json` (with git log evidence)

### Example 2: Version Claim
**Document says:** "Uses Next.js 14"
**Check:** Read `package.json`, find `"next"` dependency; check lockfile resolution
**Possible findings:**
- Accurate: `"next": "^14.0.0"` and lockfile resolves to 14.x
- Inaccurate: `"next": "^15.0.0"` (upgraded)
- Partially accurate: Main app uses 14, but one package resolves to 13

### Example 3: Code Structure
**Document says:** "The `validateEmail` function in `utils.ts`"
**Check:** grep for `validateEmail` in utils.ts, read the file
**Possible findings:**
- Accurate: Function exists at line 45, show export
- Inaccurate: Function is named `isValidEmail`
- Outdated: Function moved to `validation.ts` (with git log --follow evidence)

### Example 4: Count Claim
**Document says:** "The monorepo contains 5 packages"
**Check:** glob for `packages/*/package.json`, exclude node_modules
**Possible findings:**
- Accurate: 5 packages found (list them)
- Inaccurate: 7 packages found (2 were added)
- Show counting method in evidence

### Example 5: Architecture Claim
**Document says:** "All API routes use the `withAuth` middleware"
**Check:** grep for route handlers, check if they use `withAuth`
**Possible findings:**
- Accurate: All 12 routes use `withAuth` (show grep results)
- Partially accurate: 10 of 12 routes use it (2 are explicitly public)
- Unverifiable: Cannot determine without runtime analysis if middleware actually executes

### Example 6: Behavioral Claim
**Document says:** "Supports dark mode"
**Check:** Search for theme provider, dark mode toggle, CSS variables
**Possible findings:**
- Accurate: ThemeProvider with dark mode in `src/providers/theme.tsx:12`, toggle in `src/components/ThemeSwitch.tsx`
- Unverifiable: No theme infrastructure found, no test coverage; requires runtime validation

## When to Use

**Good use cases:**
- Before publishing documentation to users/developers
- After major refactors that may have invalidated docs
- When onboarding reveals documentation confusion
- As part of periodic documentation maintenance
- When someone reports "the docs say X but I see Y"
- Before a release to verify release notes accuracy

**Not appropriate for:**
- Gathering new information about a system (use `/fact-find`)
- Planning a feature (use `/fact-find` then `/plan-feature`)
- Verifying external documentation (only for this repo's docs)
- Real-time validation during builds (too slow)

## Anti-Patterns (Explicitly Forbidden)

### 1. Assuming without checking
"This path looks standard, probably accurate" - NO. Check every claim.

### 2. Fixing while auditing
Do not modify the document during the audit. Report findings; user decides fixes.

### 3. Marking vague claims as accurate
"The system is well-tested" - Mark as unverifiable unless you can cite specific coverage metrics.

### 4. Ignoring context
A path in a code block might be an example, not a claim about repo state. Use the exclusion rules above.

### 5. Over-reporting
"The" vs "A" word choice is not a factual claim. Focus on verifiable technical assertions.

### 6. Skipping negative evidence
If you find something that contradicts a claim, you must report it even if inconvenient.

### 7. Conflating "claim" with "intention"
"We plan to add X" is not a factual claim to verify (it's a statement of intent).

### 8. Outdated without git evidence
Never mark as "Outdated" unless you can prove via git history that it was previously true.

### 9. Classifying without evidence
Every classification (including Accurate) must have an explicit evidence pointer.

## Integration with Other Skills

| After fact-check... | Consider... |
|---------------------|-------------|
| High-severity issues found | Manual doc update, then re-run `/fact-check` |
| Architecture docs outdated | `/fact-find` to create fresh briefing |
| Plan doc inaccurate | `/re-plan` to update the plan |
| Many issues in one doc | Consider rewriting vs. patching |

## Quality Checks

Before finalizing the audit report:

- [ ] Audit anchor recorded (commit SHA or working-tree with warning)
- [ ] Claim Ledger completed with all claims identified
- [ ] Every claim in the document was categorized (or explicitly marked as not a factual claim)
- [ ] All "Accurate" findings cite evidence (path, line, snippet)
- [ ] All "Inaccurate" findings quote both the doc AND the contradicting evidence
- [ ] All "Outdated" findings include git history evidence
- [ ] Severity ratings are consistent (High = blocks understanding, Medium = confusing, Low = minor)
- [ ] Unverifiable claims explain WHY they cannot be verified
- [ ] Recommendations are actionable (not just "fix the doc")
- [ ] Evidence Log is complete and reproducible

## Completion Messages

**Clean audit:**
> "Fact-check complete. Document `<path>` audited at `<sha>`. X claims checked; all N verifiable claims are accurate. No issues found."

**Issues found:**
> "Fact-check complete. Document `<path>` audited at `<sha>`. X claims checked. Found N inaccuracies (Y high severity). Audit report saved to `<report-path>`."

**Partial audit:**
> "Fact-check complete. Checked N of M claims in `<path>` (scope: focused / large doc mode). Found N issues. Consider full audit if document is critical."

## Output Location

Save audit reports to:
- If `docs/audits/` exists: `docs/audits/<document-slug>-fact-check-YYYY-MM-DD.md`
- Otherwise: same directory as audited document, named `<document-name>.fact-check.md`

Or output directly to conversation if user prefers inline results.
