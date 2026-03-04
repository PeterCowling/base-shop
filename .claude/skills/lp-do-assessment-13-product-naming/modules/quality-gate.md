# Quality Gate

## Quality gate (before declaring pipeline complete)

- [ ] `<YYYY-MM-DD>-product-naming-spec.md` written with all 6 sections
- [ ] `product-naming-candidates-<date>.md` contains ≥ 65 rows with DWPEIC scores and Full Compound column
- [ ] `product-naming-tm-<date>.txt` contains a TM direction entry for every candidate
- [ ] `product-naming-shortlist-<date>.user.md` contains top 20 with TM Pre-Screen Status column
- [ ] Sidecar events JSONL written to `product-naming-sidecars/`
- [ ] If fewer than 10 candidates score ≥ 18: trigger new round automatically
