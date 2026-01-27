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
