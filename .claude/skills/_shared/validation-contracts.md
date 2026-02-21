# Validation Contracts (TC/VC)

## Code or Mixed (TC)

Minimum format:

```markdown
- **Test contract:**
  - **TC-01:** <scenario> -> <expected outcome>
  - **TC-02:** <error/edge> -> <expected outcome>
  - **Test type:** <unit | integration | e2e | contract>
  - **Test location:** <path>
  - **Run:** <command>
```

## Business or Mixed (VC)

Minimum format:

```markdown
- **Validation contract:**
  - **VC-01:** <scenario> -> <pass condition>
  - **VC-02:** <failure/constraint> -> <pass condition>
  - **Validation type:** <review checklist | approval gate | dry-run | rehearsal | contract>
  - **Validation location/evidence:** <path>
  - **Run/verify:** <procedure>
```

## Coverage Rules

- Every acceptance criterion maps to >=1 TC/VC.
- S effort: >=1 case.
- M effort: >=3 cases including >=1 edge/failure case.
- L effort: >=5 cases with integration/handoff coverage where applicable.

## Missing Evidence Rule

If required validation evidence cannot be produced in replan mode, create precursor tasks and keep IMPLEMENT below ready threshold.
