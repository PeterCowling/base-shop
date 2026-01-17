# Migrate to App Router

## Context
Migrate a Pages Router route to Next.js 15 App Router, preserving behavior while modernizing patterns.

## Prerequisites
- Source page: `{{sourcePath}}`
- Target app: `{{appName}}`
- Route path: `{{routePath}}`

## Key App Router Concepts
- **Server Components by default** - Use `'use client'` only when needed
- **Colocation** - Components, styles, tests can live in route folders
- **Loading & Error states** - Use `loading.tsx` and `error.tsx`
- **Layouts** - Shared UI in `layout.tsx`
- **Route Handlers** - API routes in `route.ts`

## Workflow

### 1. Analyze Source Page
Read the source file and identify:
- [ ] Data fetching method (getServerSideProps, getStaticProps, client-side)
- [ ] Client-side interactivity (useState, useEffect, event handlers)
- [ ] API calls
- [ ] Authentication/authorization
- [ ] Form handling
- [ ] Third-party libraries using browser APIs

### 2. Determine Component Type

**Use Server Component (default) if:**
- Fetches data on server
- No browser APIs needed
- No useState/useEffect
- No event handlers

**Use Client Component (`'use client'`) if:**
- Uses useState, useEffect, useReducer
- Has event handlers (onClick, onChange, etc.)
- Uses browser APIs (window, localStorage, etc.)
- Uses third-party libraries requiring browser
- Uses React Context providers/consumers

### 3. Create Route Structure

For route `/foo/bar`, create:
```
apps/{{appName}}/src/app/foo/bar/
├── page.tsx          # Main route component
├── loading.tsx       # Loading UI (optional)
├── error.tsx         # Error boundary (optional)
└── components/       # Route-specific components (optional)
    └── BarContent.client.tsx
```

### 4. Migrate Data Fetching

**From getServerSideProps:**
```tsx
// OLD (Pages Router)
export async function getServerSideProps(context) {
  const data = await fetchData(context.params.id)
  return { props: { data } }
}

export default function Page({ data }) {
  return <div>{data.title}</div>
}
```

**To Server Component:**
```tsx
// NEW (App Router)
async function getData(id: string) {
  const res = await fetch(`https://api.example.com/data/${id}`, {
    cache: 'no-store' // equivalent to getServerSideProps
  })
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default async function Page({ params }: { params: { id: string } }) {
  const data = await getData(params.id)
  return <div>{data.title}</div>
}
```

**From getStaticProps:**
```tsx
// OLD
export async function getStaticProps() {
  const data = await fetchData()
  return { props: { data }, revalidate: 60 }
}

// NEW (App Router with ISR)
export const revalidate = 60 // seconds

async function getData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 }
  })
  return res.json()
}

export default async function Page() {
  const data = await getData()
  return <div>{data.title}</div>
}
```

**From client-side fetching:**
```tsx
// OLD
export default function Page() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
  }, [])

  if (!data) return <div>Loading...</div>
  return <div>{data.title}</div>
}

// NEW (Server Component - preferred)
async function getData() {
  const res = await fetch('http://localhost:3000/api/data', {
    cache: 'no-store'
  })
  return res.json()
}

export default async function Page() {
  const data = await getData()
  return <div>{data.title}</div>
}

// OR keep client-side if needed for interactivity
'use client'

import { useEffect, useState } from 'react'

export default function Page() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
  }, [])

  if (!data) return <div>Loading...</div>
  return <div>{data.title}</div>
}
```

### 5. Split Server/Client Components

**Pattern: Server Component + Client Islands**
```tsx
// app/foo/page.tsx (Server Component)
import { ClientForm } from './components/ClientForm'

async function getData() {
  // Server-side data fetching
  const res = await fetch('...')
  return res.json()
}

export default async function Page() {
  const data = await getData()

  return (
    <div>
      <h1>{data.title}</h1>
      {/* Static content rendered on server */}
      <p>{data.description}</p>

      {/* Interactive component */}
      <ClientForm initialData={data} />
    </div>
  )
}
```

```tsx
// app/foo/components/ClientForm.tsx
'use client'

import { useState } from 'react'

export function ClientForm({ initialData }) {
  const [formData, setFormData] = useState(initialData)

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Client-side form handling
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

### 6. Add Loading States

**Create `loading.tsx`:**
```tsx
// app/foo/loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-muted rounded w-1/2 mb-4" />
      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
      <div className="h-4 bg-muted rounded w-2/3" />
    </div>
  )
}
```

### 7. Add Error Boundaries

**Create `error.tsx`:**
```tsx
// app/foo/error.tsx
'use client' // Error boundaries must be client components

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="p-4 border border-destructive rounded-md">
      <h2 className="text-lg font-semibold text-destructive">
        Something went wrong!
      </h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
      >
        Try again
      </button>
    </div>
  )
}
```

### 8. Migrate Authentication Guards

**OLD (Pages Router with middleware or HOC):**
```tsx
export const getServerSideProps = withAuth(async (context) => {
  // Protected route
})
```

**NEW (App Router):**

Option 1 - Layout-level protection:
```tsx
// app/dashboard/layout.tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function DashboardLayout({ children }) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return <div>{children}</div>
}
```

Option 2 - Page-level protection:
```tsx
// app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return <div>Dashboard</div>
}
```

### 9. Migrate API Routes

**OLD:**
```
pages/api/users/[id].ts
```

**NEW:**
```
app/api/users/[id]/route.ts
```

```tsx
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const user = await getUser(id)

  if (!user) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  // Handle POST
  return NextResponse.json({ success: true })
}
```

### 10. Update Navigation

**Replace next/router with next/navigation:**
```tsx
// OLD
import { useRouter } from 'next/router'

function Component() {
  const router = useRouter()
  router.push('/foo')
  router.query.id
}

// NEW
'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

function Component() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  router.push('/foo')
  const id = searchParams.get('id')
}
```

### 11. Migrate Dynamic Routes

**File naming stays similar:**
- `[id]/page.tsx` - Dynamic segment
- `[...slug]/page.tsx` - Catch-all
- `[[...slug]]/page.tsx` - Optional catch-all

**Type-safe params:**
```tsx
type PageProps = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = params
  const query = searchParams.query

  return <div>ID: {id}</div>
}
```

## Quality Checks

```bash
# Type checking
pnpm typecheck

# Build test
pnpm --filter @apps/{{appName}} build

# Run tests
pnpm --filter @apps/{{appName}} test

# Start dev server
pnpm --filter @apps/{{appName}} dev
```

**Manual Checks:**
- [ ] Route loads correctly
- [ ] Data fetching works (check Network tab)
- [ ] Loading states appear during data fetch
- [ ] Error handling works (test error scenarios)
- [ ] Authentication/authorization working
- [ ] Forms submit correctly
- [ ] Client-side interactivity works
- [ ] No hydration errors in console
- [ ] TypeScript types are correct
- [ ] No unnecessary 'use client' directives

## Common Pitfalls

❌ **Using 'use client' everywhere:**
```tsx
'use client' // Don't add this unless needed!

export default async function Page() {
  const data = await fetch(...) // Can be server component
  return <div>{data.title}</div>
}
```

❌ **Fetching in client when server could do it:**
```tsx
'use client'

export default function Page() {
  useEffect(() => {
    fetch('/api/data') // ❌ Should be server component
  }, [])
}
```

❌ **Not handling loading states:**
```tsx
// Missing loading.tsx and no Suspense ❌
```

❌ **Breaking metadata:**
```tsx
// OLD
export const getStaticProps = async () => ({
  props: { title: 'Page Title' }
})

// NEW - Don't forget metadata!
export const metadata = {
  title: 'Page Title'
}
```

## Reception Migration Specific

For the Reception app migration (`docs/plans/reception-nextjs-migration-plan.md`):

1. **PIN-based auth stays client-side** - Use client component for auth gate
2. **Preserve offline capability** - Keep Service Worker pattern from XA
3. **Firebase integration** - Wrap in client component with 'use client'
4. **Modal management** - Use client-side state management
5. **Keyboard shortcuts** - Client component with useEffect

## Related Documentation
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Reception Migration Plan](../../docs/plans/reception-nextjs-migration-plan.md)
- [Architecture](../../docs/architecture.md)
