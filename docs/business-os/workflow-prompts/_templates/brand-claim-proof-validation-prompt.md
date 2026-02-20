---
Type: Reference
Status: Reference
Prompt-ID: BRAND-DR-03
Stage: BD-3 (Messaging Hierarchy — Claims + Proof Ledger)
Business: {{BIZ}}
As-of: {{DATE}}
---

Objective:
Validate that each proposed claim in the messaging-hierarchy.user.md draft has
defensible evidence. Identify unsupported claims and find proof or downgrade the claim.

Claims to validate: [paste from messaging-hierarchy.user.md draft]

Sources to consult:
1. docs/business-os/strategy/{{BIZ}}/{{DATE}}-historical-performance-baseline.user.md
2. Octorate booking data (channel breakdown, lead times, review scores)
3. GA4 goal completions and conversion rates
4. Review platform scores (TripAdvisor, Google Maps) — number of reviews + average score
5. Industry benchmarks if claiming a category position ("best" / "most")

Output format — Claims + Proof Ledger table:
| Claim | Evidence found | Source (file path or URL) | Evidence type | Confidence | Verdict |
Where: Evidence type = Data/Quote/Citation/Benchmark
Verdict = Substantiated / Weakened (provide revised wording) / Remove

Stop conditions:
- Every proposed claim has a ledger row
- All Substantiated claims cite ≥1 source with path or URL
- Weakened claims have suggested rewrites
- Remove-verdict claims are flagged and removed from the messaging-hierarchy draft
