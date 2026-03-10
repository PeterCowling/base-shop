# TASK-10: SSR Bailout Marker Investigation

Investigated: 2026-02-25
Scope: `/rooms` (index), `/how-to-get-here`, `/experiences`
Status: Investigation only — no source changes made.

---

## Per-Route Analysis

### /rooms (index)

**RSC wrapper** (`apps/brikette/src/app/[lang]/rooms/page.tsx`)

The wrapper is a minimal async RSC. It:
1. Calls `generateMetadata` (server-side, reads translations, builds OG image URL).
2. Calls `getTranslations(validLang, ["roomsPage", "_tokens"])` — this pre-loads the namespaces into the i18next cache on the server so the initial client render does not spin.
3. Returns `<RoomsPageContent lang={validLang} />` with no additional server-rendered markup.

There is no static H1, no structured data, no above-the-fold content rendered server-side. The entire visible page — including the `<h1>` — is inside the client component.

**Client component** (`apps/brikette/src/app/[lang]/rooms/RoomsPageContent.tsx`)

Bailout hooks:
- `useTranslation("roomsPage", ...)` — requires `I18nextProvider` context (client-only).
- `useTranslation("ratingsBar", ...)` — same.
- `usePagePreload(...)` — wraps `useEffect`; triggers namespace pre-loading + `i18n.changeLanguage` after hydration.
- `useEffect(() => { fireViewItemList(...) }, [])` — GA4 event on mount.

What the component renders that could move to RSC:
- `<RoomsStructuredData />` — **cannot** move to RSC as-is. It uses `useCurrentLanguage()` which calls `useParams()` and `usePathname()` (client hooks), plus it calls `useTranslation` internally. To move it to RSC, a new server-only structured data component would need to be written that accepts `lang` and room data as props.
- `<h1>{pageTitle}</h1>` inside `<Section>` — the translation key is `roomsPage:hero.heading`. Since the RSC wrapper already calls `getTranslations`, the server has the translated string available. This H1 **can** move to the RSC wrapper if a server-safe translation helper is used.
- `<p>{pageSubtitle}</p>` — same: can move to RSC.
- `<RoomsSection />` — uses `useSearchParams()` internally (confirmed from Wave 2 context: `RoomDetailContent` uses it; the index `RoomsSection` passes `bookingQuery`). Requires investigation to confirm if index-level `RoomsSection` itself calls `useSearchParams`; if so, stays client-side.
- `<DirectBookingPerks />` — unknown hooks; likely presentational but needs check.
- `<AlsoHelpful />` — unknown hooks; likely presentational.

**SSR output today**: The client component is marked `"use client"` and wrapped by `I18nextProvider` (see i18n section below). React will render an HTML shell on the server, but the content returned depends on the i18n bundle being available. The `getTranslations` call in the RSC wrapper pre-populates the server-side i18next cache, so the initial server HTML should include translated text. However, the `resolveTranslatedCopy` guard (checking for i18n key tokens) means mistranslation or missing bundle silently falls back to the hardcoded English defaults — this is already resilient.

**Recommended refactor**:
1. Extract H1 + subtitle into the RSC wrapper using `getTranslations` (already called). Render them as static HTML before `<RoomsPageContent>`.
2. Create a server-only `RoomsStructuredDataRsc` component that accepts `lang: AppLanguage` as a prop, reads room data directly, and emits the `<script type="application/ld+json">` tag. Move this into the RSC wrapper.
3. The `useEffect` for `fireViewItemList` and `usePagePreload` must stay in the client component — these are inherently client-side behaviors.
4. `RoomsSection`, `DirectBookingPerks`, and `AlsoHelpful` stay client-side until each is individually audited.

---

### /how-to-get-here

**RSC wrapper** (`apps/brikette/src/app/[lang]/how-to-get-here/page.tsx`)

The wrapper is a minimal async RSC. It:
1. Builds `basePath` from the localized slug (e.g. `/en/how-to-get-here`).
2. Calls `getTranslations(validLang, ["howToGetHere", "guides"])` to pre-warm the cache.
3. Returns `<HowToGetHereIndexContent lang={validLang} basePath={basePath} />` with no additional server-rendered markup.

No H1, no structured data, no visible above-the-fold content in the RSC layer.

**Client component** (`apps/brikette/src/app/[lang]/how-to-get-here/HowToGetHereIndexContent.tsx`)

This is the most complex of the three routes. Bailout hooks:
- `useTranslation("howToGetHere", ...)` — client context required.
- `usePagePreload(...)` — `useEffect` based.
- `useEnglishFallback("howToGetHere")` — client hook (calls `useTranslation` internally).
- `useHowToGetHereContent(lang)` — custom hook; likely reads data/config, may contain hooks.
- `useDestinationFilters(...)` — custom hook managing filter state (`useState` + URL sync).
- `useState(false)` for `filtersDialogOpen`.
- `useState<string | null>(null)` for `highlightedRouteSlug`.
- `useState(false)` for `isLateNight`.
- `useHeaderStickyOffset()` — reads DOM measurements (client-only).
- `useCallback` for `handleRoutePick` — uses `requestAnimationFrame`, `document.getElementById`, `window.scrollBy` (browser API, cannot run on server).

The `!ready` early-return branch renders a fallback H1 (`"How to Get Here"`) and a list of links. This is a hardcoded English string — a minor localisation gap but not a blocker.

This component has **no structured data** component at all, which is the biggest SEO gap of the three routes.

What could move to RSC:
- An H1 from the translated `howToGetHere` page title key (if one exists in the namespace). The RSC wrapper already pre-warms the translations. However the H1 in the main render path comes from `content.header` (via `useHowToGetHereContent`) not a simple translation key, so extracting it requires understanding the content data structure.
- No structured data today — adding an RSC `HowToGetHereStructuredData` server component (e.g. a `BreadcrumbList` or `TouristAttraction` schema) is a net-new addition, not a refactor.

The filter/toolbar/scroll behavior is deeply coupled client-side. There is no meaningful static shell that can be extracted without a significant redesign of the content architecture.

**Recommended refactor** (minimal, safe):
1. Add a server-rendered H1 in the RSC wrapper if `howToGetHere:hero.heading` (or equivalent key) exists in the namespace — this surfaces text to crawlers before JS hydrates.
2. Add a new server-only structured data component in the RSC wrapper (e.g. `BreadcrumbList` or `TouristDestination` schema) using static data.
3. The entire interactive section (toolbar, filters, route cards, scroll behavior) must stay client-side.
4. The `!ready` fallback branch H1 should be replaced with a translated key rather than hardcoded English, but this is a minor i18n fix separate from the SSR refactor.

**Risk**: `useHowToGetHereContent` is a custom hook — its internal implementation has not been read. If it contains async data fetching or complex side effects, it could complicate extraction. This hook must be audited before any refactor of this route.

---

### /experiences

**RSC wrapper** (`apps/brikette/src/app/[lang]/experiences/page.tsx`)

The wrapper is a minimal async RSC. It:
1. Calls `generateMetadata` (server-side translation read).
2. Returns `<ExperiencesPageContent lang={validLang} />` with **no** `getTranslations` call in the page function itself — unlike rooms and how-to-get-here, there is no pre-warming of the i18n cache from the RSC wrapper.

This is a notable difference: the absence of `await getTranslations(...)` in the page body means the client component cannot rely on SSR-cached translations being available at hydration time.

**Client component** (`apps/brikette/src/app/[lang]/experiences/ExperiencesPageContent.tsx`)

Bailout hooks:
- `useTranslation("experiencesPage", ...)` — client context.
- `useTranslation("guides", ...)` — client context.
- `useRouter()` — client-only Next.js hook, used for `router.push(...)` in `handleOpenBooking`.
- `useOptionalModal()` — custom hook for modal context (client-only).
- `usePagePreload(...)` — `useEffect` based.
- `useEnglishFallback("experiencesPage")` — client hook.
- `useState` × 3: `clientTopicParam`, `clientTagParam`, `clientQueryString`.
- `useEffect` — reads `window.location.search` on mount to sync URL params into state.
- `useMemo` × 4: `activeFilterLabel`, `allExperienceGuides`, `guideCopy`, `faqItems`.
- `useCallback` × 2: `handleOpenBooking` (uses `router`), `handleOpenConcierge` (uses `openModal`).
- `useGuideTopicOptions(...)` — custom hook; unknown if it has further hooks.

The `ExperiencesStructuredData` component (rendered at the top of the JSX tree) also uses:
- `useCurrentLanguage()` — calls `useParams()` and `usePathname()`.
- `usePathname()` — directly.
- `useTranslation("experiencesPage", ...)` with a `ready` guard.

The `ExperiencesHero` component is marked `"use client"` but has no hooks — it is a pure presentational component that accepts `eyebrow`, `title`, `subtitle`, `scrollNudge` as props. It renders the `<h1>`. The "use client" directive is present only because it imports `CfImage` from `@acme/ui/atoms/CfImage`. If `CfImage` can be used in RSC (or if a server-safe version exists), `ExperiencesHero` could potentially be a server component.

What could move to RSC:
- A server-only `ExperiencesStructuredDataRsc` component accepting `lang` as a prop — removes the `useCurrentLanguage`, `usePathname`, and `useTranslation` hooks from the structured data path.
- The hero H1 content, if the RSC wrapper adds a `getTranslations` call and passes the resolved strings down. Currently there is no pre-warming here — this is the first fix needed.
- The static guide list (all live experience guides from `GUIDES_INDEX`) is deterministic data that could be computed server-side and passed as props, removing one `useMemo` and the `getExperienceGuides()` call from the client component.

**Missing `getTranslations` pre-warm** is a confirmed bug-risk: the `/experiences` RSC wrapper does not call `getTranslations` in the page body (unlike `/rooms` and `/how-to-get-here`). The `generateMetadata` function does call it for `"experiencesPage"`, but metadata generation and page rendering are separate execution contexts. This means the `experiencesPage` i18n namespace may not be in the cache when `ExperiencesPageContent` first renders, causing a potential flash of untranslated content or default fallback strings on first hydration.

**Recommended refactor**:
1. Add `await getTranslations(validLang, ["experiencesPage", "guides"])` to the `ExperiencesPage` function body (matches the pattern used by rooms and how-to-get-here).
2. Create a server-only `ExperiencesStructuredDataRsc` component for the RSC wrapper, removing the hook-heavy `ExperiencesStructuredData` from the client bundle's critical path.
3. Pass resolved static strings (hero eyebrow, title, subtitle) from the RSC wrapper as props to `ExperiencesPageContent`, so the hero H1 is server-rendered.
4. The `useEffect` reading `window.location.search`, `useRouter`, `useOptionalModal`, and all filter/topic state must stay client-side.
5. `ExperiencesHero` could be un-"use-client"-ified if `CfImage` is available as a server component — worth investigating separately.

---

## i18n Provider Scope

The i18n provider chain is:

```
[lang]/layout.tsx  (async RSC)
  └─ ClientLayout.tsx  ("use client")
       └─ <I18nextProvider i18n={i18n}>
            └─ <AppLayout lang={lang}>
                 └─ {children}   ← all [lang]/* pages land here
```

`ClientLayout.tsx` is the first component in the tree that is marked `"use client"`. It wraps **all** content under the `[lang]` segment in `I18nextProvider`. This means:

1. **Every page under `[lang]/` is inside a client boundary established by `ClientLayout`.** Any RSC page wrapper that renders inside `[lang]/layout.tsx` will have its children executed in the context of this client tree during hydration.

2. **RSC page wrappers themselves are still server components** — the async `RoomsPage`, `ExperiencesPage`, `HowToGetHereIndexPage` functions run on the server and are not themselves wrapped by `I18nextProvider`. Static HTML they emit is sent before the provider hydrates.

3. **The consequence for SSR refactoring**: Any content extracted into the RSC wrapper (H1, static copy, structured data) will render to HTML on the server *without* access to the `I18nextProvider` context. This is correct behavior — such content should use the server-side `getTranslations` helper, not `useTranslation`. The two translation systems (server: `getTranslations`, client: `useTranslation`) are separate and must not be mixed.

4. **No risk of double-rendering**: The `I18nextProvider` is only instantiated once per page load inside `ClientLayout`. Sub-trees that are RSC content slots will be server-rendered HTML that the client tree adopts; the `I18nextProvider` will only be active for client components that call `useTranslation`.

5. **`useEffect` in `ClientLayout` for `document.documentElement.lang/dir`** means the `<html lang>` and `<html dir>` attributes are client-updated, not server-set. This is a minor SSR hygiene issue (unrelated to the current task) but means the initial HTML document has an incorrect or missing `lang` attribute until hydration.

---

## Recommended Refactor Order

Based on complexity and risk:

### Priority 1 — Quick wins with high SSR impact

**1a. `/experiences` — add missing `getTranslations` pre-warm** (5-minute fix)
File: `apps/brikette/src/app/[lang]/experiences/page.tsx`
Add `await getTranslations(validLang, ["experiencesPage", "guides"])` before the return statement. This is a clear omission vs. the other two routes and risks flash-of-untranslated-content.

**1b. `/rooms` — extract H1 into RSC wrapper**
The RSC already pre-warms `roomsPage`. Read `hero.heading` and `hero.subheading` with `getTranslations`, render the `<Section>` + `<h1>` in the RSC wrapper, and strip those elements from `RoomsPageContent`. The client component receives no copy for the hero; it still fires the GA4 event.

### Priority 2 — Structured data server components

**2a. `RoomsStructuredDataRsc`** — new server-only component
Replace `useCurrentLanguage()` call with the `lang` prop already available from the RSC wrapper. Room data (`roomsData`, `getRoomsCatalog`) is static import — no async needed. This removes ~4 client hooks from the critical render path.

**2b. `ExperiencesStructuredDataRsc`** — new server-only component
Similar to above. Replace `useCurrentLanguage()`, `usePathname()`, and `useTranslation` with props + `getTranslations`. The `pathname` can be computed from `lang` + `getSlug("experiences", lang)`.

### Priority 3 — `/how-to-get-here` H1 extraction

Lower ROI due to the lack of a simple translation key for the page heading — requires auditing `useHowToGetHereContent` first. The fallback hardcoded-English H1 in the `!ready` branch is a localisation debt item, but addressing the SSR H1 for the main render path requires understanding the `content.header` data shape.

### Priority 4 — `/experiences` hero props promotion

Pass resolved `heroTitle`, `heroEyebrow`, `heroSubtitle` from the RSC wrapper into `ExperiencesPageContent` as props so `ExperiencesHero` renders with server-provided strings. This makes the `<h1>` in the hero available in the initial HTML. Medium complexity; depends on `ExperiencesHero` accepting server-resolved props (it already does — its props are plain strings).

---

## TASK-11 Confidence Update

Based on this investigation, TASK-11 (SSR refactoring implementation) should be scoped into two sub-tracks:

**Sub-track A — `/rooms` H1 + structured data RSC extraction**: High confidence (90%). The pattern is clean: `getTranslations` pre-warm already exists, room data is static, structured data component is self-contained. Refactor is straightforward.

**Sub-track B — `/experiences` missing pre-warm + structured data RSC extraction**: High confidence (88%). Main risk is the missing `getTranslations` call which must be the first change. Structured data extraction follows the same pattern as rooms. The `useRouter`/filter state stays client-side — no entanglement.

**Sub-track C — `/how-to-get-here` H1 extraction**: Lower confidence (65%) pending audit of `useHowToGetHereContent`. If `content.header` turns out to be a simple translated string key, confidence rises to 85%. If it requires async data, extraction may require a different approach.

**Overall recommended TASK-11 confidence: 82%** (weighted: A and B are well-defined; C carries uncertainty that should be resolved with a targeted read of `useHowToGetHereContent` before implementation begins).

**Blocking risk identified**: The `/experiences` RSC wrapper is missing `getTranslations` pre-warming. This is a live issue regardless of the refactor, and should be addressed as TASK-11 step 0 before any other change.

**Surprise finding**: `ExperiencesHero.tsx` is marked `"use client"` but has zero hooks — the directive is inherited from its `CfImage` dependency. This means the `<h1>` for `/experiences` is rendered inside a client component unnecessarily. If `CfImage` supports RSC use, the hero could be a server component with minimal effort, surfacing the H1 in the static HTML at zero hydration cost.
