---
name: create-server-action
description: Create type-safe Next.js 15 server actions with Zod validation, auth checks, error handling, revalidation, and progressive enhancement patterns.
---

# Create Server Action

Create server actions for form submissions and mutations in Next.js 15 App Router.

## Location

- Co-located: `app/<route>/actions.ts` (route-specific)
- Centralized: `src/actions/<domain>.ts` (shared)

## Basic Structure

```typescript
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; errors?: Record<string, string[]> }

export async function createItem(input: z.infer<typeof schema>): Promise<ActionResult<Item>> {
  // 1. Auth check
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  // 2. Validate
  const result = schema.safeParse(input)
  if (!result.success) {
    return { success: false, error: 'Validation failed', errors: result.error.flatten().fieldErrors }
  }

  // 3. Execute
  try {
    const item = await db.item.create({ data: result.data })
    revalidatePath('/items')
    return { success: true, data: item }
  } catch (error) {
    return { success: false, error: 'Failed to create item' }
  }
}
```

## Client Usage

### With react-hook-form (programmatic)
```typescript
const result = await createItem(data)
if (!result.success) { /* handle errors */ }
```

### With useFormState (progressive enhancement)
```typescript
'use client'
import { useFormState, useFormStatus } from 'react-dom'

const [state, formAction] = useFormState(createItem, { errors: {} })
<form action={formAction}>...</form>
```

### With useTransition (button actions)
```typescript
const [isPending, startTransition] = useTransition()
startTransition(async () => { await deleteItem(id) })
```

### With useOptimistic (instant feedback)
```typescript
const [optimistic, addOptimistic] = useOptimistic(items, (state, newItem) => [...state, newItem])
```

## Revalidation

```typescript
revalidatePath('/items')           // Specific path
revalidatePath('/items', 'layout') // Layout + all children
revalidateTag('items')             // Cache tag
```

## Checklist

- [ ] `'use server'` directive at top
- [ ] Input validated with Zod
- [ ] Auth/authz checked
- [ ] Errors handled gracefully
- [ ] Returns structured `{ success, data/error }` response
- [ ] Relevant paths revalidated
- [ ] Works without JavaScript (progressive enhancement)
