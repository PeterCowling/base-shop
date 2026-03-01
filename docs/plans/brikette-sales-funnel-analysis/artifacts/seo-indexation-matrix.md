# Booking Surface SEO / Indexation Matrix

- Task: `TASK-08`
- Verification date: `2026-03-01`
- Owner: `Codex`

## Route Policy Matrix

| Route family | Canonical target | Indexation policy | Param policy | Notes |
|---|---|---|---|---|
| `/{lang}/book` | Self-canonical (`/{lang}/book`) | `noindex,follow` | Booking params allowed for UX state, not for crawl targets | Comparison/selection surface, not landing page to index. |
| `/{lang}/dorms` | Self-canonical (`/{lang}/dorms`) | `index,follow` | Booking params are UI-state only | Supports discovery + filtering. |
| `/{lang}/dorms/[slug]` | Self-canonical (`/{lang}/dorms/[slug]`) | `index,follow` | Booking params are UI-state only | Room detail content pages remain crawl targets. |
| Outbound engine handoff URLs (`book.octorate.com/...`) | N/A | N/A | N/A | Must be `rel=\"nofollow noopener noreferrer\"`. |

## Implementation Evidence

- `/book` noindex policy:
  - `apps/brikette/src/app/[lang]/book/page.tsx` now calls `buildAppMetadata(... isPublished: false)`.
- Outbound nofollow hardening:
  - `apps/brikette/src/app/[lang]/book/page.tsx` no-JS handoff anchor now includes `rel=\"nofollow noopener noreferrer\"`.
  - `packages/ui/src/organisms/StickyBookNow.tsx` handoff anchor now includes `rel=\"nofollow noopener noreferrer\"`.
- Internal crawl-path hygiene:
  - `packages/ui/src/organisms/RoomsSection.tsx` room detail links now stay clean (`detailHref={href}`), avoiding booking-param propagation.

## Validation Notes

- Local code-level validation completed:
  - `pnpm --filter @apps/brikette typecheck` (pass)
  - `pnpm --filter @apps/brikette lint` (pass)
- Search Console verification is still required as post-deploy follow-up.
