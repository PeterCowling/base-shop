# Create API Endpoint

## Context
Create a type-safe API route handler in Next.js 15 App Router with validation and error handling.

## Prerequisites
- App: `{{appName}}`
- Route: `/api/{{routePath}}`
- Methods: `{{methods}}` (GET, POST, PUT, DELETE, PATCH)

## File Structure

```
app/api/{{routePath}}/
└── route.ts        # Route handler
```

## Workflow

### 1. Create Basic Route Handler

**GET endpoint:**
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const data = await fetchData()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**POST endpoint:**
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await createItem(body)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    )
  }
}
```

### 2. Add Input Validation

**With Zod:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = createUserSchema.parse(body)

    // Create user
    const user = await db.user.create({
      data: validatedData,
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
```

### 3. Dynamic Routes

**[id]/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = {
  params: { id: string }
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const { id } = params

  const item = await db.item.findUnique({
    where: { id },
  })

  if (!item) {
    return NextResponse.json(
      { error: 'Item not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(item)
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  const { id } = params
  const body = await request.json()

  const updated = await db.item.update({
    where: { id },
    data: body,
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  const { id } = params

  await db.item.delete({
    where: { id },
  })

  return new NextResponse(null, { status: 204 })
}
```

### 4. Query Parameters

```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '10')
  const search = searchParams.get('search') ?? undefined

  const items = await db.item.findMany({
    where: search ? {
      name: { contains: search, mode: 'insensitive' },
    } : undefined,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  })

  const total = await db.item.count()

  return NextResponse.json({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  })
}
```

### 5. Authentication

```typescript
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const body = await request.json()

  const item = await db.item.create({
    data: {
      ...body,
      userId: session.user.id,
    },
  })

  return NextResponse.json(item, { status: 201 })
}
```

### 6. CORS Headers

```typescript
export async function GET(request: NextRequest) {
  const data = await fetchData()

  return NextResponse.json(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
```

### 7. Error Handling

```typescript
class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = await processData(body)
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('API Error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 8. Rate Limiting

```typescript
import { ratelimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'

  const { success, remaining, reset } = await ratelimit.limit(ip)

  if (!success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        retryAfter: reset,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    )
  }

  // Process request
  const data = await processRequest(request)

  return NextResponse.json(data, {
    headers: {
      'X-RateLimit-Remaining': remaining.toString(),
    },
  })
}
```

### 9. File Upload

```typescript
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json(
      { error: 'No file provided' },
      { status: 400 }
    )
  }

  // Validate file
  const allowedTypes = ['image/jpeg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type' },
      { status: 400 }
    )
  }

  // Process file
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Upload to storage (e.g., S3, Cloudflare R2)
  const url = await uploadToStorage(buffer, file.name)

  return NextResponse.json({ url })
}
```

### 10. Streaming Response

```typescript
export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        const data = { count: i }
        controller.enqueue(
          encoder.encode(JSON.stringify(data) + '\n')
        )
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      controller.close()
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    },
  })
}
```

## Complete CRUD Example

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const productSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  description: z.string().optional(),
})

// GET /api/products
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '10')

    const products = await db.product.findMany({
      skip: (page - 1) * limit,
      take: limit,
    })

    const total = await db.product.count()

    return NextResponse.json({
      products,
      pagination: { page, limit, total },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = productSchema.parse(body)

    const product = await db.product.create({ data })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

// app/api/products/[id]/route.ts
type RouteContext = { params: { id: string } }

// GET /api/products/:id
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const product = await db.product.findUnique({
    where: { id: params.id },
  })

  if (!product) {
    return NextResponse.json(
      { error: 'Product not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(product)
}

// PUT /api/products/:id
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const body = await request.json()
    const data = productSchema.partial().parse(body)

    const product = await db.product.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/:id
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  await db.product.delete({
    where: { id: params.id },
  })

  return new NextResponse(null, { status: 204 })
}
```

## Quality Checks

- [ ] Input validation with Zod
- [ ] Authentication/authorization
- [ ] Error handling
- [ ] Appropriate status codes
- [ ] Rate limiting if needed
- [ ] CORS headers if needed
- [ ] Type-safe params and responses
- [ ] Database operations in try/catch

## Related
- [Server Actions](./create-server-action.md)
- [Form Validation](./add-form-validation.md)
- [Prisma Model](./create-prisma-model.md)
