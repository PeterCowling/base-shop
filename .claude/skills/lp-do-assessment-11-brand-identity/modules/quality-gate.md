# Quality Gate and Red Flags

## Quality Gate

Before saving, verify:

- [ ] `<YYYY-MM-DD>-brand-profile.user.md` was read and Audience + Personality sections are populated directly from it (no re-elicitation)
- [ ] Visual Identity section is complete: Colour Palette has >=2 rows (light), Typography has >=1 row
- [ ] Dark mode palette table is present with >=6 token rows (bg, fg, fg-muted, border, primary, accent minimum)
- [ ] Dark mode mood summary present (1 sentence)
- [ ] Token Overrides section present (may be empty table if no theme overrides needed)
- [ ] Imagery Direction has >=2 Do items and >=2 Don't items
- [ ] Signature Patterns and App Coverage may be TBD — both sections must still be present
- [ ] Frontmatter fields all present: Type, Stage, Business-Unit, Business-Name, Status, Created, Updated, Last-reviewed, Owner
- [ ] Status is `Draft` (not Active — operator review required before promoting)
- [ ] `.md` dossier saved to correct path before completion message
- [ ] HTML brand discovery document saved to `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-identity-preview.user.html`
- [ ] HTML CONFIG populated from dossier + intake packet (TBD for unavailable fields — no invented data)
- [ ] Colour palette: primary+primary-fg pairing documented (foreground on primary surface must meet WCAG AA)
- [ ] Dark mode hue family stays consistent with light palette (no switching to unrelated hue)

## Red Flags

Invalid outputs — do not emit:

- Audience or Personality sections derived differently from what is in `<YYYY-MM-DD>-brand-profile.user.md` (ASSESSMENT-10 output)
- Visual Identity section missing Colour Palette or Typography
- Dark mode palette table missing or has fewer than 6 token rows
- Dark mode palette uses a different hue family from the light palette (e.g., switching to cool grey for a warm-toned brand)
- Token Overrides section omitted entirely
- Status set to Active without operator confirmation
- `.md` dossier not saved (output must be written to file, not only displayed in chat)
- HTML brand discovery document not saved alongside the `.md`
- HTML CONFIG fields invented rather than taken from source artifacts (use TBD for unknowns)
