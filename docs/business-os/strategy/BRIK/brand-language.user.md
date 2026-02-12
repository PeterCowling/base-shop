---
Type: Brand-Language
Business-Unit: BRIK
Business-Name: Brikette
Status: Active
Created: 2026-02-12
Last-reviewed: 2026-02-12
---

# Brikette — Brand Language

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

| Role | Token | HSL (light) | HSL (dark) | Rationale |
|------|-------|-------------|------------|-----------|
| Primary | `--color-primary` | `6 78% 57%` | `6 72% 68%` | Warm coral — Airbnb/Glossier aesthetic. Resonates with young female demographic. Replaced cold teal. |
| Primary soft | `--color-primary-soft` | `6 65% 96%` | `6 60% 18%` | Tinted background for cards and highlights |
| Primary hover | `--color-primary-hover` | `6 78% 52%` | `6 72% 74%` | Slightly darker for interaction feedback |
| Primary active | `--color-primary-active` | `6 78% 47%` | `6 72% 78%` | Pressed state |
| Accent | `--color-accent` | `36 85% 55%` | `36 80% 62%` | Warm gold — complementary to coral, avoids reading as warning |
| Accent soft | `--color-accent-soft` | `36 80% 96%` | `36 65% 20%` | Tinted background |

**Palette mood:** Warm, high-saturation, Mediterranean. Coral + gold evokes sunset tones — emotional, not utilitarian.

### Typography

| Role | Token | Font Family | Rationale |
|------|-------|-------------|-----------|
| Body + headings | `--font-sans` | Plus Jakarta Sans | Geometric with high x-height for mobile legibility. Warm and approachable — replaces Geist Sans (too developer/SaaS). |
| Monospace | `--font-mono` | _(inherits base)_ | Rarely used in guest-facing UI |

**Type personality:** Friendly geometric. Approachable without being playful. High legibility at small sizes on mobile screens.

### Shape & Elevation

| Property | Token | Value | Notes |
|----------|-------|-------|-------|
| Card radius | `--radius-md` | `0.5rem` | Softer than base (0.375rem) — friendlier feel |
| Section radius | `--radius-lg` | `0.75rem` | Softer than base (0.5rem) |
| Default shadow | `shadow-sm` | _(from base)_ | Light elevation. Cards use `shadow-sm`, modals use `shadow-lg`. |

### Imagery Direction

- **Do:** Warm, candid lifestyle photography. Natural lighting. People enjoying experiences (not posing). Mediterranean color tones. User-generated content aesthetic.
- **Don't:** Stock photography with white backgrounds. Corporate headshots. Over-processed HDR travel photos. Cold/blue-toned imagery.

## Voice & Tone

### Writing Style

- **Sentence length:** Short. One idea per sentence on mobile.
- **Formality:** Casual-conversational. Like a friend who knows the area.
- **Technical level:** Zero jargon. Plain language for international travelers (many non-native English speakers).
- **Humor:** Light and situational — never forced.

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

## Token Overrides

Theme package: `packages/themes/prime/src/tokens.ts` (Prime guest portal)

**Tokens that differ from base:**

| Token | Base Value | Prime Override | Reason |
|-------|-----------|----------------|--------|
| `--color-primary` | `210 60% 45%` (blue) | `6 78% 57%` (coral) | Warm lifestyle palette |
| `--color-primary-fg` | _(base)_ | `0 0% 100%` | White text on coral |
| `--color-primary-soft` | _(base)_ | `6 65% 96%` | Tinted card backgrounds |
| `--color-primary-hover` | _(base)_ | `6 78% 52%` | Interaction state |
| `--color-primary-active` | _(base)_ | `6 78% 47%` | Pressed state |
| `--color-accent` | _(base)_ | `36 85% 55%` (gold) | Complementary warm accent |
| `--color-accent-fg` | _(base)_ | `0 0% 10%` | Dark text on gold |
| `--color-accent-soft` | _(base)_ | `36 80% 96%` | Tinted background |
| `--font-sans` | system/Geist | Plus Jakarta Sans | Friendly geometric |
| `--radius-md` | `0.375rem` | `0.5rem` | Softer corners |
| `--radius-lg` | `0.5rem` | `0.75rem` | Softer corners |

**Brikette marketing site** uses base theme (no overrides yet). TBD — whether marketing site adopts Prime's warm palette or maintains neutral base.

## Signature Patterns

### Gradient Cards

**When:** Hero sections, feature highlights, social proof cards.
**Implementation:** `bg-gradient-to-br from-primary-soft to-accent-soft` with `rounded-2xl shadow-sm`.
**Example:** `apps/prime/src/components/SocialHighlightsCard.tsx`

### Warm CTA Buttons

**When:** Primary actions (book, explore, confirm).
**Implementation:** `bg-primary text-primary-foreground hover:bg-primary-hover rounded-md px-4 py-2 font-medium`.
**Example:** Standard across Prime app.

_More patterns will be added as `/design-spec` identifies them during feature work._

## App Coverage

| App | Theme | Status | Notes |
|-----|-------|--------|-------|
| prime | `packages/themes/prime/` | Active | Guest portal — fully branded |
| brikette | `packages/themes/base/` | Active | Marketing site — uses base. TBD: adopt warm palette? |
| reception | _(TBD)_ | Planned | Staff app — may need distinct "operational" variant |
| brikette-scripts | N/A | N/A | No UI |

## References

- Business strategy: `docs/business-os/strategy/BRIK/plan.user.md`
- Prime theme tokens: `packages/themes/prime/src/tokens.ts`
- Base theme tokens: `packages/themes/base/src/tokens.ts`
- Design refresh fact-find: `docs/plans/prime-design-refresh-fact-find.md`
- Design refresh plan: `docs/plans/prime-design-refresh-plan.md`
- Design system handbook: `docs/design-system-handbook.md`
