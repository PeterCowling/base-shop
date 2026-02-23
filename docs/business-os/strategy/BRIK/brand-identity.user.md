---
Type: Brand-Identity
Stage: ASSESSMENT-11
Business-Unit: BRIK
Business-Name: Brikette
Status: Active
Created: 2026-02-12
Updated: 2026-02-21
Last-reviewed: 2026-02-17
Owner: Pete
Token-Source: packages/themes/prime/src/tokens.ts
---

# Brikette — Brand Dossier

> Token values are not duplicated in this document. The single source of truth is
> `packages/themes/prime/src/tokens.ts`. The Token Rationale section below records
> *why* each token was chosen, not what value it holds.

## Audience

**Primary:** Young female travelers, 18-25 (60% of users), 99% female, 99% under 35. Booking hostel stays and local experiences in Positano, Italy.
**Secondary:** Hostel staff using reception tools (internal — separate visual context).
**Device:** Mobile-only (Prime guest portal), responsive (brikette marketing site).
**Context:** On-the-move travelers using their phone one-handed during a hostel stay. Thumb-zone reachability matters. Decisions are quick, emotional, experience-driven — not comparison-shopping.

## Personality

- **Warm**, not corporate
- **Inviting**, not clinical
- **Expressive**, not minimal
- **Modern**, not trendy-for-its-own-sake
- **Friendly**, not childish

## Visual Identity

### Color Palette

| Role | Token | Rationale |
|------|-------|-----------|
| Primary | `--color-primary` | Warm coral — Airbnb/Glossier aesthetic. Resonates with young female demographic. Replaced cold teal. |
| Primary soft | `--color-primary-soft` | Tinted background for cards and highlights |
| Primary hover | `--color-primary-hover` | Slightly darker for interaction feedback |
| Primary active | `--color-primary-active` | Pressed state |
| Accent | `--color-accent` | Warm gold — complementary to coral, avoids reading as warning |
| Accent soft | `--color-accent-soft` | Tinted background |

**Palette mood:** Warm, high-saturation, Mediterranean. Coral + gold evokes sunset tones — emotional, not utilitarian.

**Canonical token names** (from `packages/themes/base/src/tokens.ts`):
`--color-primary` (+ `-fg`, `-soft`, `-hover`, `-active`), `--color-accent` (+ `-fg`, `-soft`), `--color-bg`, `--color-fg`, `--color-fg-muted`, `--color-border`.

### Typography

> **Constraint:** All fonts must be freely available — Google Fonts or system stacks only. No paid or licensed typefaces.

| Role | Token | Font Family | Source | Rationale |
|------|-------|-------------|--------|-----------|
| Body + headings | `--font-sans` | Plus Jakarta Sans | [Google Fonts](https://fonts.google.com/specimen/Plus+Jakarta+Sans) | Geometric with high x-height for mobile legibility. Warm and approachable — replaces Geist Sans (too developer/SaaS). |
| Monospace | `--font-mono` | _(inherits base)_ | System stack | Rarely used in guest-facing UI |

**Google Fonts URL:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap`

**Type personality:** Friendly geometric. Approachable without being playful. High legibility at small sizes on mobile screens.

### Shape & Elevation

| Property | Token | Rationale |
|----------|-------|-----------|
| Card radius | `--radius-md` | Softer than base — friendlier feel |
| Section radius | `--radius-lg` | Softer than base |
| Default shadow | `shadow-sm` | Light elevation. Cards use `shadow-sm`, modals use `shadow-lg`. |

### Token Rationale

> Reference `packages/themes/prime/src/tokens.ts` for actual values. This section records the
> design reasoning so token changes are intentional, not accidental.

| Token | Design rationale |
|-------|-----------------|
| `--color-primary` | Warm coral chosen for Airbnb/Glossier aesthetic affinity with 18-25 female demographic |
| `--color-primary-fg` | White text ensures WCAG AA contrast on coral background |
| `--color-primary-soft` | Low-saturation tint for card backgrounds without visual noise |
| `--color-primary-hover` | Slightly darker coral for clear interactive feedback |
| `--color-primary-active` | Pressed state — darker still, clearly distinct from hover |
| `--color-accent` | Warm gold is complementary to coral on the color wheel; avoids danger/warning reading |
| `--color-accent-fg` | Dark text on gold background for WCAG contrast |
| `--color-accent-soft` | Tinted accent background (same logic as primary-soft) |
| `--font-sans` | Plus Jakarta Sans chosen for: geometric warmth, high x-height on mobile, approachable feel |
| `--radius-md` | Slightly larger than base to feel friendlier, not sharper/corporate |
| `--radius-lg` | Same philosophy as radius-md at section level |

**Dark mode:** inherits base dark tokens

### Imagery Direction

- **Do:** Warm, candid lifestyle photography. Natural lighting. People enjoying experiences (not posing). Mediterranean color tones. User-generated content aesthetic.
- **Don't:** Stock photography with white backgrounds. Corporate headshots. Over-processed HDR travel photos. Cold/blue-toned imagery.

## Voice & Tone

### Writing Style

- **Sentence length:** Short. One idea per sentence on mobile.
- **Formality:** Casual-conversational. Like a friend who knows the area.
- **Technical level:** Zero jargon. Plain language for international travelers (many non-native English speakers).
- **Humour:** light and dry — situational, never forced.

### Key Phrases

- "Your stay" not "Your booking" (experience, not transaction)
- "Explore" not "Browse" (adventure, not shopping)
- "Experiences" not "Activities" (emotional, not functional)
- "We recommend" not "Featured" (personal, not algorithmic)

### Words to Avoid

- "Checkout" — too transactional for hospitality
- "Users" — they're "guests"
- "Click" — they're tapping on mobile
- "Dashboard" — too corporate for guest-facing UI

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

## App Coverage

| App | Theme | Status | Notes |
|-----|-------|--------|-------|
| prime | `packages/themes/prime/` | Active | Guest portal — fully branded |
| brikette | `packages/themes/base/` | Active | Marketing site — uses base. TBD: adopt warm palette? |
| reception | _(TBD)_ | Planned | Staff app — may need distinct "operational" variant |
| brikette-scripts | N/A | N/A | No UI |

## References

- Business strategy: `docs/business-os/strategy/BRIK/plan.user.md`
- Strategy index (artifact status): `docs/business-os/strategy/BRIK/index.user.md`
- Prime theme tokens (source of truth): `packages/themes/prime/src/tokens.ts`
- Base theme tokens: `packages/themes/base/src/tokens.ts`
- Design refresh fact-find: `docs/plans/prime-design-refresh-fact-find.md`
- Design refresh plan: `docs/plans/prime-design-refresh-plan.md`
- Design system handbook: `docs/design-system-handbook.md`

## Proof Ledger

| Claim | Evidence | Source | Confidence |
|-------|----------|--------|------------|
| 99% female, primarily 18-25 | Booking platform demographic data | Octorate/manual review | Medium |
| Coral resonates with target demographic | Airbnb/Glossier brand affinity | Design rationale + market research | Medium |
| Plus Jakarta Sans outperforms Geist Sans for guest-facing legibility | UX decision at design refresh | Prime design refresh fact-find | Medium |
