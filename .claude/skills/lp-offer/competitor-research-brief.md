# Competitor Research Brief

**Mode**: Model A — read-only analysis. No file writes. Max output: **200 words**. JSON only.

## Scope

Research ONE competitor (URL/name provided by orchestrator). Do not expand scope.

## Fields to Extract

- `competitor_name`: canonical brand name
- `pricing`: price points and model (one-time/subscription/usage). "not found" if paywalled.
- `positioning_promise`: headline value prop (verbatim from site if possible)
- `icp_signals`: target audience signals visible on site (role, size, use case)
- `proof_claims`: testimonials, case study stats, certifications cited on site
- `key_objections`: pains from reviews (G2, Trustpilot, app store) — customer verbatim language
- `differentiators`: features or guarantees they emphasise that competitors don't

## Required Output Schema

```json
{
  "status": "ok | fail | warn",
  "outputs": {
    "competitor_name": "", "pricing": "",
    "positioning_promise": "", "icp_signals": "",
    "proof_claims": "", "key_objections": "", "differentiators": ""
  },
  "touched_files": [], "tokens_used": 0
}
```

Return ONLY this JSON. No raw web content — only structured compact extracts.
Main context never receives raw web content.
