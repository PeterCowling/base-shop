# Domain: Brand Copy Compliance

**Goal**: Verify guest-facing copy aligns with the Brand Dossier voice, messaging hierarchy, and avoidance list.
**Required output schema**: `{ domain: "brand-copy", status: "pass|fail|warn", checks: [{ id: "<BC-04>", status: "pass|fail|warn", evidence: "<string>" }] }`

> **Pre-flight check:** If `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-identity-dossier.user.md` is absent, skip all Domain 5 checks with note: _"Brand Dossier absent — skipping brand copy compliance checks."_ All Domain 5 failures are warnings (GATE-BD-06b Warn) — they do not block launch.

## Checks

- **BC-04 [GATE-BD-06b Warn]: Words to Avoid**
  - **What:** Scan guest-facing page copy (headings, CTAs, descriptions) against the brand-dossier "Words to Avoid" list
  - **Pass condition:** None of the avoid-words appear in guest-facing copy (or any found instance is flagged for review)
  - **Evidence:** Manual audit of page copy vs. brand-dossier Words to Avoid section; list any instances
  - **Fail condition:** Avoid-words present in headings, CTAs, or primary copy → Warning
  - **Note:** Skip if brand-dossier lacks "Words to Avoid" section; note the absence

- **BC-05 [GATE-BD-06b Warn]: Claims in Messaging Hierarchy**
  - **What:** Verify substantive marketing claims (features, guarantees, benefits) have a corresponding entry in `messaging-hierarchy.user.md` Claims + Proof Ledger (if the file exists)
  - **Pass condition:** All substantive claims on guest-facing pages map to a Claims + Proof Ledger entry
  - **Evidence:** List of substantive claims found on site → status in Claims + Proof Ledger (Substantiated / Missing)
  - **Fail condition:** Substantive claim has no proof ledger entry → Warning
  - **Note:** Skip entirely if `docs/business-os/strategy/<BIZ>/messaging-hierarchy.user.md` does not yet exist; note the absence

- **BC-07 [GATE-BD-06b Warn]: Key Phrase alignment**
  - **What:** Verify primary CTA labels and key UX labels match brand-dossier Key Phrases (e.g., "Explore" not "Browse", "Your stay" not "Your booking")
  - **Pass condition:** CTAs and key labels are consistent with Key Phrases list
  - **Evidence:** Screenshot or list of CTAs + brand-dossier Key Phrases cross-reference
  - **Fail condition:** Primary CTAs contradict Key Phrases or use avoid-words → Warning
  - **Note:** Skip if brand-dossier lacks Key Phrases section; note the absence

## Domain Pass Criteria

All Domain 5 failures are warnings — skip the domain entirely if `<YYYY-MM-DD>-brand-identity-dossier.user.md` is absent.
