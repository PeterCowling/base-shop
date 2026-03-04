## Quality Gate

Before saving, verify:

- [ ] Conditionality gate was executed first — skill halted for non-physical-product business
- [ ] All 7 sections present with non-placeholder content
- [ ] Structural Format: specific packaging type named (not "TBD"); channel context documented
- [ ] Surface Design Scope: colour treatment, design approach, and finish all present (may be provisional pending operator input)
- [ ] Regulatory Requirements Checklist: ≥ 3 items sourced from reference data for the named category; regulation references present (not just "EU law")
- [ ] EAN/Barcode Note: explicitly states whether required or not, with GS1 reference
- [ ] Designer Handoff Checklist: all rows present with "Pending" or "Available" status
- [ ] Frontmatter: Type, Stage, Business-Unit, Business-Name, Status, Created, Updated, Owner all present
- [ ] Artifact saved to correct path before completion message

## Red Flags

Invalid outputs — do not emit:

- Artifact created for a non-physical-product business (conditionality gate must halt first)
- Regulatory Requirements Checklist with generic placeholder items not sourced from the reference data file
- Regulatory requirements invented rather than read from `regulatory-requirements.md`
- Structural Format left as "TBD" without a derived recommendation
- EAN section absent or not addressing whether a barcode is required
- Artifact not saved (output must be written to file, not only displayed in chat)
- Out-of-scope product category covered without directing operator to specialist advice
