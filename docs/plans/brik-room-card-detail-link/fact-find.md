---
Feature-Slug: brik-room-card-detail-link
Business: BRIK
Outcome: infeasible
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Status: Infeasible
Dispatch-ID: IDEA-DISPATCH-20260228-0001
Created: 2026-02-28
---

# Fact-Find: BRIK Room Cards — "More About This Room" Link to Per-Room Detail Route

## Summary

**Feature is already fully implemented.** The "More About This Room" link exists on every room card on `/en/rooms` and is rendered correctly for all 10 hostel rooms. No planning or build work is needed.

## Access Declarations

None. Investigation relied entirely on source code reads and a headless browser observation of the running dev server.

## Investigation Findings

### Entry Points

| Location | Role |
|---|---|
| `packages/ui/src/organisms/RoomsSection.tsx:229–238` | Renders "More About This Room" `<Link>` per room card |
| `apps/brikette/src/components/rooms/RoomsSection.tsx` | Brikette adapter — wraps the organism, passes through to it |
| `apps/brikette/src/app/[lang]/rooms/RoomsPageContent.tsx` | Renders brikette RoomsSection on the listing page |
| `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` | Renders brikette RoomsSection on the book page |

### What the Organism Renders (lines 229–238)

```tsx
<Link
  href={`/${lang}/${roomsSlug}/${room.id}`}  // e.g. /en/rooms/double_room
  aria-label={`More About This Room ${title}`}
  className="mt-2 inline-flex min-h-11 items-center self-start text-sm font-medium
    text-brand-primary underline hover:text-brand-bougainvillea …"
>
  {resolveTranslatedCopy(t("moreAboutThisRoom", { defaultValue: "More About This Room" }), "More About This Room")}
</Link>
```

- URL pattern: `/{lang}/{SLUGS.rooms[lang]}/{room.id}` — matches the brikette per-room route exactly
- SLUGS identical between `packages/ui/src/slug-map.ts` and `apps/brikette/src/slug-map.ts`
- i18n key `moreAboutThisRoom` exists in `src/locales/en/roomsPage.json` with value `"More About This Room"`
- On the `/rooms` page: link is appended with no query string (clean URL)
- On the `/book` page: link carries the active booking query (`?checkin=…&checkout=…&pax=…`)

### Browser Verification (headless, localhost:3012/en/rooms)

All 10 room cards confirmed live with correct hrefs:

| Room | Link href |
|---|---|
| Double Room | `/en/rooms/double_room` |
| Premium Mixed Dorm | `/en/rooms/room_10` |
| Superior Female Dorm – Large Terrace | `/en/rooms/room_11` |
| Superior Mixed Dorm | `/en/rooms/room_12` |
| Value Female Dorm | `/en/rooms/room_3` |
| Value Mixed Dorm | `/en/rooms/room_4` |
| Superior Female Dorm – Sea View | `/en/rooms/room_5` |
| Superior Female Dorm – 7 Beds | `/en/rooms/room_6` |
| Deluxe Mixed Room | `/en/rooms/room_9` |
| All Female Dorm with one Bunkbed | `/en/rooms/room_8` |

## Kill Rationale

The "more about" per-room link is already implemented in `packages/ui/src/organisms/RoomsSection.tsx` and is live and discoverable on the running dev server. There is no implementation gap to address.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Organism link render | Yes | None | No |
| Brikette adapter passthrough | Yes | None | No |
| SLUGS consistency | Yes | None | No |
| i18n key presence | Yes | None | No |
| Live browser verification | Yes | None | No |

## Evidence Gap Review

### Gaps Addressed
- Confirmed organism renders the link (source read, lines 229–238)
- Confirmed brikette adapter passes through without suppression (source read)
- Confirmed SLUGS match (both files read)
- Confirmed i18n key exists in EN locale
- Confirmed live render via headless browser observation

### Confidence Adjustments
None needed — all evidence corroborates. Confidence: 100%.

### Remaining Assumptions
None.
