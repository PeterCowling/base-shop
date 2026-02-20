---
Type: Reference
Status: Reference
---
# Evidence Gap Review Checklist (Outcome A)

Run this checklist before setting `Status: Ready-for-planning`.

## 1) Citation Integrity
- [ ] Every non-trivial claim has evidence pointers.
- [ ] Dependency claims are traced to real usage/import sites.
- [ ] Inferred claims are clearly marked as inference.

## 2) Boundary Coverage
- [ ] Integration boundaries were inspected (APIs/queues/webhooks where relevant).
- [ ] Security boundaries were inspected (auth/authz/validation where relevant).
- [ ] Error/fallback paths were considered.

## 3) Testing/Validation Coverage
- [ ] Existing tests were verified, not only listed.
- [ ] Coverage gaps for touched paths were identified.
- [ ] Extinct tests (if any) were called out.

## 4) Business Validation Coverage
- [ ] Hypotheses are explicit.
- [ ] Signal coverage is explicit (`evidence` vs `untested`).
- [ ] Channel/compliance claims cite official references when required.

## 5) Confidence Calibration
- [ ] Scores reflect evidence, not optimism.
- [ ] Confidence reductions were made where gaps remain.
- [ ] "What raises this to >=80 and >=90" actions are concrete.

## 6) Record the Review in Brief

Populate:
- `## Evidence Gap Review`
- `### Gaps Addressed`
- `### Confidence Adjustments`
- `### Remaining Assumptions`
