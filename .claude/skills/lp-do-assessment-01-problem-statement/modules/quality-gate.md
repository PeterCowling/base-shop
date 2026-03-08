## Quality Gate

Before saving, verify all items:

- [ ] Frontmatter block present with all required fields (Type, Stage, Business, Status, Created, Method, Downstream)
- [ ] Core Problem uses customer language; no solution framing, no "need" / "should build" / product names
- [ ] Core Problem describes the structural gap, not just "a problem exists" — must name why the market fails
- [ ] At least one affected user group is named with specific qualifying detail and confidence tag
- [ ] Segmentation note present if a meaningful sub-segment boundary affects product or copy
- [ ] Severity AND frequency qualified separately per segment — not combined as "significant"
- [ ] Every severity/frequency claim carries a confidence tag: (checked), (claimed-by-sources), (inferred), or (unknown — gap)
- [ ] Workarounds are in table format with all four columns populated
- [ ] Documented failure states subsection present with at least two named failure modes and sources
- [ ] Every evidence item carries a confidence tag: (checked), (claimed-by-sources), or (inferred)
- [ ] Research appendix created and linked if evidence set exceeds 8 items
- [ ] Problem boundary section present with both In-scope and Out-of-scope subsections
- [ ] Open questions section present with exactly the top 8 priority questions
- [ ] Each kill condition has Status + Evidence basis + "Unblocked by:" path
- [ ] No kill condition left as "N/A" or empty
- [ ] STOP advisory present and explicit if any kill condition is FAIL
- [ ] Downstream artifacts table present and complete
- [ ] Key sources section present (5–6 max in main document)
- [ ] Artifact saved to correct path before completion message

## Red Flags

Invalid outputs — do not emit:

- Core Problem describes a solution: "users need X," "users want a platform for Y"
- Core Problem is so broad it applies to any business: "people want to save time," "businesses want more customers"
- Affected user group is generic: "small businesses," "consumers," "people who shop online"
- Severity or frequency stated as "high" or "significant" without a qualifier or evidence tag
- Workarounds as prose list instead of table — table format is required
- Documented failure states section missing or containing only "users are unhappy"
- Evidence items with no confidence tag — every item must be tagged
- Kill condition section with Pass/Fail but no "Unblocked by:" path — provisional PASS without an unblocking condition is not acceptable
- STOP advisory suppressed when a kill condition is FAIL
- Downstream artifacts table missing
- Frontmatter block missing
- Artifact not saved (output must be written to file, not only displayed in chat)

## Research Appendix Pattern

When the problem has significant supporting research (>8 evidence items, or when first-party validation questions have been researched and answered), create:

**Path:** `docs/business-os/strategy/<BIZ>/s0a-research-appendix.user.md`

**Frontmatter:**
```
Stage: ASSESSMENT-01
Business: <BIZ>
Created: <YYYY-MM-DD>
Status: Complete / Partial — [sections complete]
Questions-source: Problem Statement <date> operator brief
```

Structure by question category (e.g., A: Segment clarity, B: Frequency/severity, C: JTBD, D: Workarounds, E: WTP, F: Product requirements, G: Organisation, H: Channels/trust, I: Kill-condition proof tests). Each section: question asked → research findings → sources → what remains unknown.

Reference from the main problem statement as: `*Full evidence set in research appendix: \`s0a-research-appendix.user.md\`*`
