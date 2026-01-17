---
Type: Reference
Status: Active
Domain: Theming
Last-reviewed: 2026-01-17
Relates-to charter: docs/theming-charter.md
---

# Theming Token → Component Matrix

This matrix maps Theme Editor-exposed tokens to components that emit `data-token` attributes. It focuses on Theme Editor coverage, not every token in the system.

Notes:
- Entries are conditional on component variants (for example Tag/ProductBadge colors).
- Token sources should exist in the base theme (`packages/themes/base/src/tokens.ts`).

| Token | Components |
| --- | --- |
| `--color-primary` | AnnouncementBar, LiveChatWidget (user bubble), Switch, ProductBadge (primary), Tag (primary), RevokeSessionButton, MfaChallenge, ProfileForm, CheckoutTemplate, CheckoutForm (buttons) |
| `--color-primary-fg` | AnnouncementBar, ProductBadge (primary), Tag (primary), RevokeSessionButton, MfaChallenge, ProfileForm |
| `--color-accent` | ProductBadge (accent), Tag (accent) |
| `--color-accent-fg` | ProductBadge (accent), Tag (accent) |
| `--color-bg` | StickyAddToCartBar, LiveChatWidget, GiftCardBlock, ImageSlider, Toast (default fg) |
| `--color-fg` | ProductBadge (default/soft), Tag (default/soft), GiftCardBlock, ImageSlider |
| `--color-muted` | LiveChatWidget (agent bubble), ProductBadge (default), Tag (default), Progress, CartTemplate (muted labels), Toast (default) |
| `--color-muted-fg` | Progress (label) |
| `--color-success` | ProductBadge (success), Tag (success), ProfileForm (success state), Toast (success) |
| `--color-success-fg` | ProductBadge (success), Tag (success), Toast (success) |
| `--color-info` | ProductBadge (info), Tag (info), Toast (info) |
| `--color-info-fg` | ProductBadge (info), Tag (info), Toast (info) |
| `--color-warning` | ProductBadge (warning), Tag (warning), Toast (warning) |
| `--color-warning-fg` | ProductBadge (warning), Tag (warning), Toast (warning) |
| `--color-danger` | ProductBadge (danger), Tag (danger), CartTemplate (remove), RevokeSessionButton (error), MfaChallenge (error), ProfileForm (error), CheckoutForm (alerts), Toast (danger) |
| `--color-danger-fg` | ProductBadge (danger), Tag (danger), Toast (danger) |
| `--surface-input` | Switch |

Related docs:
- `docs/theme-editor-tokens.md`
