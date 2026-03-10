## Quality Gate

Before saving, verify:

- [ ] All 9 sections present with non-placeholder content
- [ ] Mark Type is one of: wordmark, lettermark, symbol + wordmark, abstract mark — rationale provided
- [ ] Icon-only derivative specified in Mark Type section (required for all digital-presence businesses)
- [ ] Colour Specification maps token names from brand identity dossier; white and near-black labelled as "Utility neutral" (not invented from thin air)
- [ ] HSL expressed as `H S% L%`; hex as 6-digit uppercase; hex omitted with note if conversion not confident
- [ ] Typography Specification references the heading font from the dossier; if TBD, noted explicitly; includes modification policy and license note
- [ ] Deliverables and Lockups section (Section 4) present with at least the minimum viable set
- [ ] Use Case List has ≥ 4 use cases; social icon, website header, email header, and favicon always present for web-enabled businesses
- [ ] Forbidden Territory has ≥ 2 concrete, actionable constraints (not vague directives); category anti-patterns only included if category/positioning explicitly stated in strategy docs
- [ ] Reference Inspirations has ≥ 2 entries (or explicit operator-request note)
- [ ] Frontmatter: Type, Stage, Business-Unit, Business-Name, Status (Draft), Created, Updated, Owner, Inputs all present
- [ ] Inputs list in frontmatter contains exact filenames of all source documents used
- [ ] Business-Name sourced from product naming doc; name reconciliation note present if discrepancy found
- [ ] Section 9 AI Mock-Up Prompt present: single plain-text code block; opens with imperative "Generate"; ≤ 200 words; lists 4 named compositions explicitly (not just "4 variations"); includes "after each image, write 2–3 sentences..."; uses no font names or brand token names; uses hex colour values directly; includes "no X" negative instructions from Forbidden Territory
- [ ] Artifact saved to correct path before completion message
- [ ] Steps 12–15 attempted: icon character resolved, app-dir resolution documented (found or not found)
- [ ] If app-dir found: SVG files written, raster script run, layout.tsx updated (or skipped with reason noted)
- [ ] If app-dir not found: skip message with full run command included in Completion Message

## Red Flags

Invalid outputs — do not emit:

- Mark Type left as "TBD" or undefined
- Colour Specification with invented HSL values not drawn from the brand dossier (white and near-black as utility neutrals are allowed)
- Typography TBD without a specific note about when and how it will be resolved
- No deliverables section — a brief without a deliverables list is incomplete for a designer engagement
- Icon-only derivative not addressed when business has digital presence
- Use Case List with fewer than 4 use cases for a web-enabled business; fewer than 3 for non-digital
- Forbidden Territory with fewer than 2 items, or items so vague they are not actionable ("avoid ugly logos")
- Category anti-patterns in Forbidden Territory without explicit evidence in strategy docs
- Inputs block missing from frontmatter
- Business-Name sourced from brand profile when product naming doc is available
- Artifact not saved (output must be written to file, not only displayed in chat)
