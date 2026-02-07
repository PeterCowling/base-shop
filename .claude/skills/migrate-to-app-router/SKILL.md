---
name: migrate-to-app-router
description: Migrate Next.js Pages Router routes to App Router. Covers data fetching, server/client split, loading/error states, auth guards, and navigation updates.
---

# Migrate to App Router

Convert Pages Router routes to Next.js 15 App Router patterns.

## Key Concepts

- **Server Components by default** — only add `'use client'` when needed
- **Data fetching in components** — no more `getServerSideProps`/`getStaticProps`
- **Colocation** — components, loading, error states live in route folders
- **Layouts** — shared UI in `layout.tsx`

## Route Structure

```
apps/<app>/src/app/<route>/
├── page.tsx          # Main route (Server Component)
├── loading.tsx       # Suspense fallback
├── error.tsx         # Error boundary ('use client' required)
└── components/       # Route-specific client components
    └── FormClient.tsx
```

## Data Fetching Migration

| Pages Router | App Router |
|-------------|-----------|
| `getServerSideProps` | `async function` in Server Component + `cache: 'no-store'` |
| `getStaticProps` | `async function` + `next: { revalidate: N }` |
| `getStaticProps` + `revalidate` | `export const revalidate = N` |
| Client-side `useEffect` fetch | Server Component fetch (preferred) or keep client |

## Server vs Client Decision

**Server Component (default):**
- Fetches data, no browser APIs, no useState/useEffect, no event handlers

**Client Component (`'use client'`):**
- useState, useEffect, event handlers, browser APIs, React Context, third-party browser libs

## Pattern: Server + Client Islands

```tsx
// page.tsx (Server)
import { ClientForm } from './components/ClientForm'

export default async function Page({ params }: { params: { id: string } }) {
  const data = await getData(params.id)
  return (
    <div>
      <h1>{data.title}</h1>
      <ClientForm initialData={data} />
    </div>
  )
}
```

## Navigation Updates

```tsx
// OLD: import { useRouter } from 'next/router'
// NEW:
'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
```

## Auth Guards

```tsx
// Layout-level protection
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function Layout({ children }) {
  const session = await auth()
  if (!session) redirect('/login')
  return <div>{children}</div>
}
```

## Metadata (replaces Head)

```tsx
export const metadata = { title: 'Page Title', description: '...' }
// or dynamic:
export async function generateMetadata({ params }) { ... }
```

## Checklist

- [ ] Route loads correctly
- [ ] Data fetching works
- [ ] Loading/error states present
- [ ] Auth working
- [ ] No unnecessary `'use client'`
- [ ] No hydration errors
- [ ] Navigation updated to `next/navigation`
- [ ] Metadata migrated
