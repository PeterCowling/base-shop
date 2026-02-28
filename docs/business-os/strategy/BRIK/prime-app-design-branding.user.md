---
Type: Prime-Design-Branding
Business-Unit: BRIK
App: prime
Status: Active
Created: 2026-02-17
Last-reviewed: 2026-02-17
Token-Source: packages/themes/prime/src/tokens.ts
Related-Brand-Identity: docs/business-os/strategy/BRIK/2026-02-12-brand-identity-dossier.user.md
Owner: Pete
Review-trigger: After each completed build cycle touching this document.
---

# Prime App — Design & Branding Policy

Prime-specific projection of the BRIK brand. Governs all guest-facing surfaces for the Prime
guest portal. For cross-cutting brand decisions (voice, personality, audience), see the Brand Dossier.

> Token values are not duplicated here. The single source of truth is
> `packages/themes/prime/src/tokens.ts`. Refer to the Token Rationale in `brand-identity.user.md`
> for the design reasoning behind each token choice.

## Governed Surfaces

- Prime guest portal (all guest-facing pages)
- Brikette website (booking and guide pages) — to be aligned in a future pass
- Email templates sent to guests

## Surfaces NOT Governed (Internal)

- Reception app (staff-facing, operational)
- Business OS (internal admin)
- Owner/admin dashboards within Prime

## Target Demographic

| Segment | Share | Design implication |
|---------|-------|--------------------|
| Female | ~99% | Avoid cold/corporate palettes. Favor warm, expressive, lifestyle-aligned aesthetics. |
| Age 18-25 | ~60% | Mobile-native generation. Expect app-quality design (Instagram, Airbnb, Pinterest level). High sensitivity to visual polish and micro-interactions. |
| Age 26-35 | ~39% | Similar expectations, slightly more tolerance for functional design. Still mobile-first. |
| Age 35+ | ~1% | Not a design driver. |
| Mobile-only | 100% | Prime is accessed on guests' phones during their stay. No desktop/tablet use case. |

## Design Principles

1. **Warm over cold** — Primary palette uses warm hues (coral, rose, warm violet, sage) rather than cold corporate blues/teals.
2. **Approachable typography** — Friendly geometric sans-serifs (Plus Jakarta Sans) over developer-oriented fonts (Geist Sans). Rounded terminals signal warmth.
3. **Expressive but not noisy** — Subtle gradients, soft shadows, and gentle motion. Avoid flat gray backgrounds. Slight warm tints on surfaces.
4. **Mobile-only, thumb-first** — Prime is a phone-only app. Design exclusively for mobile viewports. Optimize for one-handed use, thumb-zone reachability, handheld viewing distance. Primary actions belong in the bottom half of the screen.
5. **Mobile-native quality bar** — Benchmarks against Airbnb, Pinterest, Hostelworld, and Instagram. Card-based layouts, generous radius, smooth transitions, high-quality imagery.
6. **Inclusive, not stereotyped** — Warm, polished, photography-forward, emotionally resonant. Not "pink everything."
7. **Token-driven** — All visual changes flow through `packages/themes/prime/src/tokens.ts`. No hardcoded Tailwind colors. Ensures dark mode, accessibility, and future theme variants work automatically.

## Token Rationale

See `docs/business-os/strategy/BRIK/2026-02-12-brand-identity-dossier.user.md` § Token Rationale for the full table.
Key Prime-specific decisions:
- `--color-primary`: Warm coral (replaces cold teal) — aligned to Airbnb/Glossier aesthetic for 18-25 female demographic
- `--font-sans`: Plus Jakarta Sans — geometric warmth, high x-height for mobile legibility
- `--radius-md` / `--radius-lg`: Softer than base — friendlier feel at card and section level

## Signature Patterns

### Gradient Cards

**When:** Hero sections, feature highlights, social proof cards.
**Implementation:** `bg-gradient-to-br from-primary-soft to-accent-soft` with `rounded-2xl shadow-sm`.
**Example:** `apps/prime/src/components/SocialHighlightsCard.tsx`

### Warm CTA Buttons

**When:** Primary actions (book, explore, confirm).
**Implementation:** `bg-primary text-primary-foreground hover:bg-primary-hover rounded-md px-4 py-2 font-medium`.
**Example:** Standard across Prime app.

_More patterns will be added as `/lp-design-spec` identifies them during feature work._

## References

- Brand Dossier (cross-cutting brand decisions): `docs/business-os/strategy/BRIK/2026-02-12-brand-identity-dossier.user.md`
- Prime theme tokens (source of truth): `packages/themes/prime/src/tokens.ts`
- Base theme tokens: `packages/themes/base/src/tokens.ts`
- Design system handbook: `docs/design-system-handbook.md`
- Design refresh fact-find: `docs/plans/prime-design-refresh-fact-find.md`
