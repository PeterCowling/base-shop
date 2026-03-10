---
Type: Results-Review
Status: Draft
Feature-Slug: hbag-proof-bullets-real-copy
Review-date: 2026-02-28
artifact: results-review
---

# Results Review

## Observed Outcomes

- The `productPage.proofBullets` array in `data/shops/caryina/site-content.generated.json` now contains five real proof bullets. The three previous placeholder strings ("Generated from canonical packet", "Claims constrained by packet", "Policy and support blocks remain deterministic") are no longer present. The PDP will show real customer-facing copy on the next build and deploy. Live rendering not verified (SSL error on caryina.com at time of build); visual confirmation required post-deploy.
- A bug in the bullet extraction helper was found and fixed during this build: the stop pattern used to find the end of a markdown section was too narrow, stopping only at h3 headings (`###`) rather than any heading level. This caused the HBAG packet to spill bullets from unrelated sections. The corrected pattern (`^#{2,}\s+`) stops at h2 or h3, which is the correct behaviour for all callers of this helper.

## Standing Updates

- `docs/business-os/startup-baselines/HBAG-content-packet.md`: Now contains the authoritative source of proof bullet copy. Any future edit to proof bullets should be made here first, then the materializer re-run to update the committed JSON. The compiler warning at the top of the packet must remain in place until the `compile-website-content-packet` tool is extended to port the proof bullet section.
- No standing-information Layer A file requires update: this build fixed a content and code gap, not a standing-information gap. The HBAG content packet itself is the Layer A artifact that was updated.

## New Idea Candidates

- Markdown section extractor stops at any heading — make it explicit in the function's JSDoc | Trigger observation: extractBulletList() had no comment explaining the stop-pattern behaviour; the bug was only caught during integration testing. A one-line JSDoc comment would prevent similar bugs. | Suggested next action: defer (too small to justify a card; add comment opportunistically in next materializer edit).
- Materializer CLI fails silently when run from the wrong working directory | Trigger observation: `pnpm --filter scripts startup-loop:materialize-site-content-payload` resolves `repoRoot` to the scripts/ package directory, causing a "Missing source packet" error with no helpful diagnostic about the cwd. | Suggested next action: create card — add a `cwd` sanity check to the materializer CLI (detect when `docs/` is not a subdirectory of `process.cwd()` and emit a helpful error).
- Compiler overwrite risk still relies on a manual warning comment | Trigger observation: the only guard against `compile-website-content-packet --business HBAG` overwriting the proof bullets is a markdown blockquote in the packet. If the operator misses it, the materializer will start failing closed with no visible explanation at the compile step. | Suggested next action: defer — low probability short-term; revisit when compiler is next extended.

## Standing Expansion

No standing expansion: this build's learnings are captured in the HBAG content packet (updated) and the materializer tests (new). No new Layer A standing-information artifact is warranted. The materializer cwd issue is a future card candidate, not a standing-information update.

## Intended Outcome Check

- **Intended:** The `productPage.proofBullets` array in `data/shops/caryina/site-content.generated.json` contains five real, customer-facing proof bullets authored in the content packet. The materializer's `buildPayload()` function extracts bullets from the `### Product Proof Bullets` section of the content packet and produces equivalent real copy when re-run. A structural fail-closed validation rule blocks the materializer from writing output when the section is missing or yields zero bullet lines.
- **Observed:** JSON contains 5 real bullets (verified by reading `data/shops/caryina/site-content.generated.json`). Materializer extraction confirmed (5 bullets, no placeholders, exit 0). Fail-closed gate implemented and covered by TC-proof-bullets-02 and TC-proof-bullets-03. Live PDP render pending post-deploy verification.
- **Verdict:** Met
- **Notes:** Live rendering was not verified at build time due to SSL error on caryina.com. The code path is deterministic (server reads JSON at render time; JSON is correct), so the outcome is considered met. Operator should confirm PDP copy on next deploy.
