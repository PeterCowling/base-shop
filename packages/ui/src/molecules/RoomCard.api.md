# RoomCard Consolidation Notes

## 1. Audit snapshot (2025-06-24)

### Application adapter – `src/components/rooms/RoomCard.tsx`
- Wraps the shared UI component and supplies app-only hooks: `useModal`, `useRoomPricing`, and date utilities.
- Pulls translations via `useTranslation` to build facilities, price copy, CTA labels, and image labels before rendering the shared component.
- Manages fullscreen modal state locally with `FullscreenImage`, feeding it the image that triggered the enlarge event.
- Keeps historical test IDs alive by wiring `price.skeletonTestId = "price-loading"` to the shared card.
- Test coverage in `RoomCard.test.tsx` and `RoomCard.modal.test.tsx` exercises pricing states, CTA payloads, and fullscreen toggling.

### Design-system component – `packages/ui/src/molecules/RoomCard.tsx`
- Depends only on local UI atoms (`RoomImage`) and shared utilities (`../shared/testIds`, `../types/roomCard`); shared primitives come via the `@ui` alias.
- Exports `ROOM_CARD_ACTION_BUTTON_CLASS` alongside the memoised component; consumes `ROOM_CARD_TEST_IDS.priceSkeleton` internally.
- Emits a `RoomCardFullscreenRequest` payload when `onRequestFullscreen` is provided; leaves overlay rendering to the adapter/consumer.
- Provides English fallbacks for image labels and the no-image placeholder; expects callers to pass translated labels when required.
- Unit-tested in `packages/ui/src/molecules/__tests__/RoomCard.test.tsx` (CTA wiring, skeleton/sr copy, fullscreen payload, carousel loop).

### Net gaps
- Storybook/MDX docs still pending; keep adapters aligned with the canonical component.

## 2. Target shared API (proposed)

The design-system card should accept *render-ready* data and callbacks; no implicit i18n, pricing fetches, or modal wiring. Proposed TypeScript contract:

```ts
export interface RoomCardFacility {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface RoomCardPrice {
  loading?: boolean;
  formatted?: string; // e.g. "From €80.00"
  loadingLabel?: string; // sr-only loading copy
  skeletonTestId?: string;
  soldOut?: boolean;
  soldOutLabel?: string;
  info?: string; // optional tooltip/disclaimer copy displayed next to the price
}

export interface RoomCardAction {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

export interface RoomCardImageLabels {
  enlarge: string;
  prevAria: string;
  nextAria: string;
  empty?: string;
}

export interface RoomCardFullscreenRequest {
  image: string;
  index: number;
  title: string;
}

export interface RoomCardProps {
  id: string;
  title: string;
  images: string[];
  imageAlt: string;
  imageLabels?: RoomCardImageLabels; // defaults to English fallbacks
  onRequestFullscreen?: (payload: RoomCardFullscreenRequest) => void;
  facilities?: RoomCardFacility[];
  price?: RoomCardPrice;
  actions: RoomCardAction[]; // expected order is rendered order
  className?: string;
  lang?: string; // reserved for analytics / attr wiring
}
```

Key expectations:
- `title`, `imageAlt`, `facility.label`, CTA `label`, and price strings arrive pre-translated by the consumer.
- Pricing fetches stay outside; pass `price.loading`/`price.formatted`/`price.soldOut` as needed.
- Consumers own analytics/modal hooks; `onSelect` is invoked with no payload, letting wrappers close over booking context.
- Fullscreen behaviour is optional: if `onRequestFullscreen` is omitted the card renders without the enlarge affordance.

## 3. Styling tokens & structure
- Root `<article>` uses the existing brand palette classes: `border-brand-surface`, `bg-brand-bg`, `text-brand-primary`, `text-brand-terra`, etc.
- CTA buttons reuse a shared tailwind stack; expose it via a local `ROOM_CARD_ACTION_BUTTON` string for reuse in adapters/tests.
- Skeleton uses `bg-brand-surface` with `animate-pulse`; screen-reader copy is provided by `price.loadingLabel`.
- Facilities list remains stacked (`flex flex-col space-y-2`) with inline icon/text pair styling.
- The optional `lang` prop is now applied to the `<article>`, so markup carries locale metadata when provided.

## 4. Support utilities surfaced from `packages/ui`
- `resolveAssetPath(image: string): string` (in `shared/media.ts`) normalises legacy `/images/` prefixes.
- `ROOM_CARD_TEST_IDS` re-exported from `RoomCard.tsx` anchors shared test selectors.
- `ROOM_CARD_ACTION_BUTTON_CLASS` exposes the canonical Tailwind stack for CTAs.
- **Open question:** should we add a `createRoomCardPriceCopy` helper for default English copy, or keep examples explicit?

## 5. Next steps (implementation checklist)
- [x] Move `resolveAssetPath` + related helpers into `packages/ui/src/shared/media.ts`.
- [x] Extract minimal facility type union into `packages/ui/src/types/facility.ts`; update both app + DS to import from there.
- [x] Refactor `packages/ui/src/atoms/RoomImage.tsx` to drop `react-i18next` dependency and accept `RoomCardImageLabels` props.
- [x] Implement the new `RoomCardProps` contract with internal tests (storybook follow-up still pending).
- [x] Replace `src/components/rooms/RoomCard.tsx` with an adapter that composes data/hooks and renders the shared component.
- [x] Delete the duplicated DS clone once adapter lands; ensure exports updated via `packages/ui/src/molecules/index.ts`.
- [x] Re-export `ROOM_CARD_TEST_IDS` from `RoomCard.tsx` to keep consumers on a single entry point.
- [x] Add `roomsPage.roomImage.noImage` (or helper) so adapters avoid hard-coded English.
- [x] Keep `<article lang=…>` on the canonical card; adapters should pass locale strings when available.
- [ ] Add Storybook docs or MDX usage guidance once the API stabilises.

- Keep `packages/ui/molecules/RoomCard` as the canonical implementation; treat `src/components/rooms/RoomCard` as an adapter that composes pricing/i18n/modal concerns.
- Short-term: backfill `roomImage.noImage` translations and document the `imageLabels` contract so consumers surface locale-specific copy.
- Medium-term: surface optional helpers (price copy factory, default labels) and add Storybook/MDX docs so downstream teams can adopt the component without spelunking.
- Longer-term: audit other app surfaces still importing `FacilityIcon` or modal helpers directly to ensure they can lean on the shared card + adapter patterns.
