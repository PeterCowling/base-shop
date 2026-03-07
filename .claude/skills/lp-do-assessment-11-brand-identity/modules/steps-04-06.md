# Steps 4–6 — Save Dossier, Generate HTML Preview, Report

### Step 4: Fill and save brand dossier

Using the template at `.claude/skills/_shared/brand-language-template.md` as the structural reference:

1. Copy the template structure.
2. Carry Audience, Personality, and Voice & Tone directly from `<YYYY-MM-DD>-brand-profile.user.md` — do not re-derive.
3. Fill Visual Identity and Token Overrides from Steps 2–3.
4. Set Signature Patterns to `TBD — patterns emerge through lp-design-spec work`.
5. Fill App Coverage if an app exists; otherwise set to `TBD — app not yet built`.
6. Set `Status: Draft`.
7. Save to the output path.

### Step 5: Generate HTML brand discovery document

After saving the `.md` dossier, produce a second output: a self-contained HTML brand discovery document at `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-identity-preview.user.html`.

**Approach:** Use `docs/business-os/strategy/HBAG/<YYYY-MM-DD>-brand-identity-preview.user.html` as the rendering template — copy the JS rendering engine verbatim. Only populate the `CONFIG` object at the top with this business's data. Do not modify the rendering functions.

**CONFIG field mapping** (derive each from the artifacts you have already read):

```
CONFIG.meta
  businessCode    <- <BIZ> code
  businessName    <- confirmed operating name from <YYYY-MM-DD>-brand-profile.user.md
  tagline         <- first key phrase from Voice & Tone, or "TBD"
  coreClaim       <- top 3 key phrases joined with ". " or "TBD"
  date            <- current month + year
  stage           <- "ASSESSMENT-11 Complete"
  market          <- primary channel + geography from intake packet or <YYYY-MM-DD>-launch-distribution-plan.user.md; "TBD" if not available
  tamNote         <- market size note from intake packet or "TBD"
  priceRange      <- price range from intake packet or offer

CONFIG.colours     <- map all light-mode tokens from brand dossier Colour Palette section
  primary, primaryFg, primarySoft, primaryHover, accent, accentSoft,
  background, text (= --color-fg), textMuted, border, surface

CONFIG.paletteDisplay  <- ["primary", "accent", "background", "primarySoft", "accentSoft"]

CONFIG.darkColours <- map all dark-mode tokens from brand dossier Dark Mode section
  background, surface, text, textMuted, border,
  primary, primaryFg, primarySoft, primaryHover, accent, accentSoft

CONFIG.fonts
  heading         <- heading font from Typography section (family, weights, sample sentences from key phrases)
  body            <- body font from Typography section (family, weights)

CONFIG.radius     <- { md: <--radius-md value>, lg: <--radius-lg value or "8px"> }

CONFIG.problem    <- problem statement from intake packet or <YYYY-MM-DD>-problem-statement.user.md; "TBD" if not available

CONFIG.solution   <- solution description from intake packet or s0c-option-select.user.md; "TBD" if not available

CONFIG.icps       <- ICP array from intake packet; empty array [] if not available

CONFIG.forecast   <- forecast numbers from S3 artifact if available; empty array [] if not yet run

CONFIG.personality <- map personality adjective pairs from brand dossier (positive/negative format)

CONFIG.keyPhrases  <- key phrases from Voice & Tone section (phrase + note)

CONFIG.wordsToAvoid <- words to avoid from Voice & Tone section (term + reason)

CONFIG.products    <- product list from intake packet or PRODUCT-01 artifact if available; empty array [] if not yet available

CONFIG.namingJourney <- naming history from naming shortlist artifacts if available; omit field (set to null) if not available
```

**Font loading:** Update the `<link>` tag in `<head>` to load the correct Google Fonts for this business (from the Typography section of the dossier).

**Title tag:** Update to `Brand Discovery Document — <Business Name>`.

**If CONFIG fields are unavailable:** Use `"TBD"` for string fields and `[]` for array fields. Never invent data.

### Step 6: Report

Report:
- Sections complete vs TBD in the `.md` dossier
- Which CONFIG fields were populated vs TBD in the HTML
- Any design decisions the operator may want to review or override
- Whether the dossier is sufficient for `/lp-design-spec` to proceed at DO
