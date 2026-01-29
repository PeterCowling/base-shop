<!-- /src/components/AGENTS.md -->

# Agents – Components & UI

## 1 · Naming conventions

| Target        | Case       | Example           |
| ------------- | ---------- | ----------------- |
| Folders\*     | kebab-case | `user-profile/`   |
| Components    | PascalCase | `UserProfile.tsx` |
| Files (other) | camelCase  | `formatDate.ts`   |

\* Single-word folders (`assets/`, `hooks/`, …) are exempt.  
`eslint-plugin-filenames` enforces these rules.

---

## 2 · Golden rules

- **Functional components only**; state via Hooks.
- Pure separation: **state ↔ business logic ↔ UI**.
- **Strict TypeScript** – `any` is forbidden.
- One file = one component; begin with `// src/components/Foo.tsx`.
- Prefer fragments (`<>…</>`) over wrapper `<div>`.
- Render lists with `.map()` and **stable keys** (never array index).
- Optimise with `React.memo`, `useMemo`, `useCallback`.
- Don’t pass inline arrow functions / object literals unless memoised.
- Comments explain **why**, not **what**.
- DRY: extract duplicated JSX / logic.

---

## 3 · Local state vs Context

| Scope      | API           | Typical use-case           |
| ---------- | ------------- | -------------------------- |
| Component  | `useState`    | input value, toggle, modal |
| Complex    | `useReducer`  | wizard, multi-step form    |
| Cross-page | React Context | theme, auth, language      |

Avoid duplicating loader data from routes; prefer `useLoaderData()`.

---

## 4 · Shared components lifted into `@acme/ui`

- Assistance navigation (`HelpCentreNav`, `HelpCentreMobileNav`) and the ferry article section now live in `@acme/ui/organisms/*`. The app-level files in `src/components/assistance/` are thin wrappers: they prep translations, current-route state, and pass a `renderLink` mapper that binds React Router links.
- When adding new assistance guides, update the canonical sources: `@/data/assistance.tags.ts` (for tags) and `@/data/assistanceGuideKeys.ts` (for the key list). The wrappers feed the translated labels into the UI package props.
- If another route needs these UIs, import them straight from `@acme/ui/organisms/...` rather than cloning the JSX. Supply your own `items`/`copy` payloads so the component stays framework-agnostic.

---

## 5 · Guide authoring & cross-referencing

### Related guides (manifest-driven)

When you add guide keys to `manifest.relatedGuides` in `guide-manifest.ts`, they automatically render in the footer. No explicit `relatedGuides` block needed.

**Curation principles:**
- Pick 2–6 related guides per guide
- Match intent: overview, next step, alternative, return journey, prerequisite
- Follow patterns by guide type (beach, directions, overview, experience)
- Avoid linking to everything (noise) or `draftOnly` guides from live guides

**Reciprocity:** If A links to B, consider whether B should link back. Not all relationships are symmetric (overview guides often don't reciprocate), but directional guides (outbound/return) should be.

### Inline links (%LINK: tokens)

Use `%LINK:guideKey|link text%` sparingly (2-5 per guide):
- At decision points: "If ferries stop, %LINK:pathOfTheGodsBus|take the bus instead%"
- Where details are omitted: "See our %LINK:ticketingGuide|complete guide%"
- For comparisons: "Unlike %LINK:fornilloBeach|Fornillo%, the main beach..."

The draft editor's link picker inserts these tokens safely.

### Google Maps links (%URL: tokens)

Include maps links in any guide with directions or routes. Use the `api=1` URL format:

```
%URL:https://www.google.com/maps/dir/?api=1&origin=Hostel+Brikette&destination=Main+Beach&travelmode=walking|Google Maps walking route%
```

**Label conventions:**
- "Google Maps walking route" (travelmode=walking)
- "Google Maps transit route" (travelmode=transit)
- "View on Google Maps" (search, single location)

### Validation

Before committing guide changes:
```bash
pnpm --filter @apps/brikette validate-content   # JSON schema
pnpm --filter @apps/brikette validate-links     # token syntax & references
pnpm --filter @apps/brikette validate-manifest  # relatedGuides correctness
pnpm --filter @apps/brikette report-coverage    # coverage & orphans
```

**See:** `docs/guide-authoring-best-practices.md` for detailed patterns, examples, and guide type templates.
