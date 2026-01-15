# Create Server Action

## Context
Create a type-safe server action in Next.js 15 App Router for handling form submissions and mutations.

## Prerequisites
- App: `{{appName}}`
- Action name: `{{actionName}}`
- Location: `apps/{{appName}}/src/actions/` or co-located with route

## Server Actions Overview

Server Actions are asynchronous functions that run on the server and can be called from Client or Server Components.

**Benefits:**
- Progressive enhancement (works without JS)
- Type-safe
- Automatic revalidation
- Built-in error handling

## Workflow

### 1. Decide on Location

**Option 1: Co-located (recommended for simple actions)**
```
app/dashboard/
├── page.tsx
└── actions.ts         // Actions for this route
```

**Option 2: Centralized (for shared actions)**
```
src/actions/
├── auth.ts           // Authentication actions
├── user.ts           // User management
└── product.ts        // Product actions
```

### 2. Create Action File

**Basic structure:**
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function {{actionName}}(formData: FormData) {
  // 1. Extract and validate data
  // 2. Perform server-side operation
  // 3. Revalidate cache if needed
  // 4. Return result or redirect
}
```

### 3. Add Type-Safe Actions

**With Zod validation:**
```typescript
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// Define schema
const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().int().positive().optional(),
})

type CreateUserInput = z.infer<typeof createUserSchema>

// Type-safe action
export async function createUser(data: CreateUserInput) {
  // Validate input
  const validatedData = createUserSchema.parse(data)

  try {
    // Perform database operation
    const user = await db.user.create({
      data: validatedData,
    })

    // Revalidate relevant paths
    revalidatePath('/users')

    return { success: true, user }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user'
    }
  }
}
```

**With FormData (for progressive enhancement):**
```typescript
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const formSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

export async function createUserFromForm(formData: FormData) {
  // Extract data from FormData
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
  }

  // Validate
  const result = formSchema.safeParse(rawData)

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    }
  }

  try {
    const user = await db.user.create({
      data: result.data,
    })

    revalidatePath('/users')

    return { success: true, user }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create user'
    }
  }
}
```

### 4. Add Authentication/Authorization

**Check user permissions:**
```typescript
'use server'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function deletePost(postId: string) {
  // Get current user
  const session = await auth()

  // Check authentication
  if (!session?.user) {
    redirect('/login')
  }

  // Check authorization
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  })

  if (post?.authorId !== session.user.id) {
    throw new Error('Unauthorized')
  }

  // Perform action
  await db.post.delete({
    where: { id: postId },
  })

  revalidatePath('/posts')
  redirect('/posts')
}
```

### 5. Handle Errors Gracefully

**Structured error responses:**
```typescript
'use server'

import { z } from 'zod'

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; errors?: Record<string, string[]> }

const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().min(0),
})

export async function updateProduct(
  id: string,
  input: z.infer<typeof productSchema>
): Promise<ActionResult<Product>> {
  try {
    // Validate input
    const data = productSchema.parse(input)

    // Update product
    const product = await db.product.update({
      where: { id },
      data,
    })

    revalidatePath(`/products/${id}`)

    return { success: true, data: product }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        errors: error.flatten().fieldErrors,
      }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: 'Product not found' }
      }
    }

    return { success: false, error: 'Failed to update product' }
  }
}
```

### 6. Revalidation Strategies

**Revalidate specific paths:**
```typescript
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

export async function updateBlogPost(id: string, data: PostData) {
  await db.post.update({ where: { id }, data })

  // Revalidate specific paths
  revalidatePath('/blog')                    // Blog listing
  revalidatePath(`/blog/${data.slug}`)       // Individual post
  revalidatePath('/blog', 'layout')          // Blog layout

  // Or use tags
  revalidateTag('blog-posts')
}
```

**Full route revalidation:**
```typescript
export async function clearCache() {
  // Revalidate all paths in the blog section
  revalidatePath('/blog', 'layout')
}
```

### 7. Use in Client Components

**With useFormState (recommended):**
```typescript
'use client'

import { useFormState } from 'react-dom'
import { createUser } from './actions'

const initialState = {
  success: false,
  error: null,
}

export function CreateUserForm() {
  const [state, formAction] = useFormState(createUser, initialState)

  return (
    <form action={formAction}>
      <input type="text" name="name" required />
      <input type="email" name="email" required />

      {state.error && (
        <p className="text-destructive">{state.error}</p>
      )}

      <button type="submit">Create User</button>
    </form>
  )
}
```

**With useFormStatus (for pending states):**
```typescript
'use client'

import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create User'}
    </button>
  )
}

export function CreateUserForm() {
  return (
    <form action={createUser}>
      <input type="text" name="name" required />
      <input type="email" name="email" required />
      <SubmitButton />
    </form>
  )
}
```

**With useTransition (for programmatic calls):**
```typescript
'use client'

import { useTransition } from 'react'
import { deletePost } from './actions'

export function DeleteButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      await deletePost(postId)
    })
  }

  return (
    <button onClick={handleDelete} disabled={isPending}>
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  )
}
```

### 8. Add Optimistic Updates

**For instant UI feedback:**
```typescript
'use client'

import { useOptimistic } from 'react'
import { addComment } from './actions'

export function CommentList({ comments }: { comments: Comment[] }) {
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state, newComment: Comment) => [...state, newComment]
  )

  const handleSubmit = async (formData: FormData) => {
    const content = formData.get('content') as string

    // Add optimistically
    addOptimisticComment({
      id: 'temp-' + Date.now(),
      content,
      createdAt: new Date(),
    })

    // Call server action
    await addComment(formData)
  }

  return (
    <div>
      {optimisticComments.map(comment => (
        <div key={comment.id}>{comment.content}</div>
      ))}

      <form action={handleSubmit}>
        <textarea name="content" required />
        <button type="submit">Add Comment</button>
      </form>
    </div>
  )
}
```

### 9. File Uploads

**Handle file uploads:**
```typescript
'use server'

import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File

  if (!file) {
    return { success: false, error: 'No file provided' }
  }

  // Validate file type and size
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Invalid file type' }
  }

  if (file.size > maxSize) {
    return { success: false, error: 'File too large (max 5MB)' }
  }

  try {
    // Convert to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save to disk or upload to cloud
    const path = join(process.cwd(), 'public/uploads', file.name)
    await writeFile(path, buffer)

    // Save metadata to database
    const upload = await db.upload.create({
      data: {
        filename: file.name,
        path: `/uploads/${file.name}`,
        size: file.size,
        mimeType: file.type,
      },
    })

    return { success: true, data: upload }
  } catch (error) {
    return { success: false, error: 'Failed to upload file' }
  }
}
```

### 10. Rate Limiting

**Add rate limiting:**
```typescript
'use server'

import { ratelimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

export async function sendMessage(content: string) {
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for') ?? 'unknown'

  // Check rate limit
  const { success, remaining } = await ratelimit.limit(ip)

  if (!success) {
    return {
      success: false,
      error: 'Too many requests. Please try again later.'
    }
  }

  // Process message
  await db.message.create({
    data: { content },
  })

  return { success: true, remaining }
}
```

## Common Patterns

### CRUD Operations

**Create:**
```typescript
'use server'

export async function createItem(data: ItemInput) {
  const validated = itemSchema.parse(data)
  const item = await db.item.create({ data: validated })
  revalidatePath('/items')
  return { success: true, data: item }
}
```

**Read (usually in Server Component, not action):**
```typescript
// In Server Component
async function ItemsPage() {
  const items = await db.item.findMany()
  return <ItemList items={items} />
}
```

**Update:**
```typescript
'use server'

export async function updateItem(id: string, data: Partial<ItemInput>) {
  const validated = itemSchema.partial().parse(data)
  const item = await db.item.update({
    where: { id },
    data: validated
  })
  revalidatePath(`/items/${id}`)
  return { success: true, data: item }
}
```

**Delete:**
```typescript
'use server'

export async function deleteItem(id: string) {
  await db.item.delete({ where: { id } })
  revalidatePath('/items')
  redirect('/items')
}
```

## Quality Checks

```bash
# Type checking
pnpm typecheck

# Build to verify server actions compile
pnpm --filter @apps/{{appName}} build

# Test the action
pnpm --filter @apps/{{appName}} test -- --testPathPattern actions
```

**Checklist:**
- [ ] Action has 'use server' directive
- [ ] Input is validated with Zod
- [ ] Errors are handled gracefully
- [ ] Authentication/authorization checked if needed
- [ ] Relevant paths revalidated
- [ ] Returns structured response (success/error)
- [ ] Type-safe inputs and outputs
- [ ] Progressive enhancement (works without JS)
- [ ] Rate limiting if needed
- [ ] File uploads validated if applicable

## Common Mistakes

❌ **Missing 'use server':**
```typescript
// ❌ Won't work as server action
export async function myAction() {}
```

❌ **No validation:**
```typescript
'use server'

// ❌ Accepting untrusted input
export async function updateUser(data: any) {
  await db.user.update({ data })
}
```

❌ **Not handling errors:**
```typescript
'use server'

// ❌ Errors crash the app
export async function createPost(data: PostInput) {
  const post = await db.post.create({ data }) // May throw
  return post
}
```

❌ **Forgetting revalidation:**
```typescript
'use server'

// ❌ Cache not updated
export async function updatePost(id: string, data: PostData) {
  await db.post.update({ where: { id }, data })
  // Missing: revalidatePath('/posts')
}
```

## Related
- [Next.js Server Actions docs](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Form validation](./add-form-validation.md)
- [API routes](./create-api-endpoint.md)
