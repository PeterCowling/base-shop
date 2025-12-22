<!-- /src/hooks/AGENTS.md -->

# Agents – Hooks & State-Management

## 1 · State-management matrix

| Concern      | Source / API                   | Notes                               |
| ------------ | ------------------------------ | ----------------------------------- |
| Remote / DB  | `loader()` ➜ `useLoaderData()` | Keeps URL ⇔ UI in sync              |
| UI-local     | `useState`, `useReducer`       | Component-scoped                    |
| Cross-page   | `localStorage` + Context       | e.g. theme, language                |
| Global cache | — (none yet)                   | Zustand or similar may arrive later |

### Rules

- **Never** duplicate loader data in client state.
- Prefer URL path/query params over hidden vars.
- Cross-page persistence → `localStorage` + Context (no cookies).
- `useFetcher()` optimistic updates planned, not yet in use.

---

## 2 · Authoring custom hooks

- Prefix hook names with `use`.
- Keep them pure: no JSX returns.
- Extract side-effects into `useEffect` inside the hook.
- Accept only the minimal input props; return a stable API (array or object).
- Memoise heavy computations with `useMemo`.
