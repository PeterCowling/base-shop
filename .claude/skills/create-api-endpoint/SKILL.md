---
name: create-api-endpoint
description: Create type-safe Next.js 15 App Router API route handlers with Zod validation, authentication, error handling, pagination, and rate limiting.
---

# Create API Endpoint

Create Next.js 15 App Router route handlers at `app/api/<path>/route.ts`.

## Basic Structure

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
})

export async function GET(request: NextRequest) {
  try {
    const data = await fetchData()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    const result = await createItem(data)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}
```

## Dynamic Routes

File: `app/api/items/[id]/route.ts`

```typescript
type RouteContext = { params: { id: string } }

export async function GET(request: NextRequest, { params }: RouteContext) {
  const item = await db.item.findUnique({ where: { id: params.id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}
```

## Key Patterns

### Authentication
```typescript
const session = await auth()
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Pagination
```typescript
const page = parseInt(searchParams.get('page') ?? '1')
const limit = parseInt(searchParams.get('limit') ?? '10')
const items = await db.item.findMany({ skip: (page - 1) * limit, take: limit })
```

### Status Codes
- `200` — Success (GET, PUT)
- `201` — Created (POST)
- `204` — No content (DELETE)
- `400` — Validation error
- `401` — Unauthorized
- `404` — Not found
- `429` — Rate limited
- `500` — Server error

## Checklist

- [ ] Input validated with Zod
- [ ] Authentication/authorization checked
- [ ] Errors handled with appropriate status codes
- [ ] Database operations in try/catch
- [ ] Rate limiting if public-facing
- [ ] CORS headers if cross-origin
