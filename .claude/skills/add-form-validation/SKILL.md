---
name: add-form-validation
description: Add client and server-side form validation using Zod schemas and react-hook-form. Covers schema definition, form components, server actions, and progressive enhancement.
---

# Add Form Validation

Implement type-safe form validation with Zod + react-hook-form.

## Stack

- **Zod** — Schema validation (shared client/server)
- **react-hook-form** — Form state management
- **@hookform/resolvers/zod** — Integration bridge

## Workflow

### 1. Define Schema

Create in `schemas/<formName>.ts`:

```typescript
import { z } from 'zod'

export const myFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  age: z.number().int().positive().optional(),
})

export type MyFormInput = z.infer<typeof myFormSchema>
```

### 2. Create Form Component

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { myFormSchema, type MyFormInput } from '@/schemas/myForm'

export function MyForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MyFormInput>({
    resolver: zodResolver(myFormSchema),
  })

  const onSubmit = async (data: MyFormInput) => {
    const result = await submitAction(data)
    if (!result.success && result.errors) {
      Object.entries(result.errors).forEach(([field, msgs]) => {
        setError(field as any, { type: 'server', message: msgs?.[0] })
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">Name</label>
        <input id="name" {...register('name')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium disabled:opacity-50">
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}
```

### 3. Server-Side Validation

```typescript
'use server'

import { myFormSchema } from '@/schemas/myForm'

export async function submitAction(data: unknown) {
  const result = myFormSchema.safeParse(data)
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors }
  }
  // Process validated data...
  return { success: true }
}
```

## Advanced Patterns

- **Async validation**: `.refine(async (val) => !(await checkExists(val)), 'Already exists')`
- **Conditional fields**: `.refine()` with conditional logic based on other fields
- **Field arrays**: `useFieldArray({ control, name: 'items' })`
- **Controlled inputs**: `<Controller>` for custom components (DatePicker, etc.)
- **Progressive enhancement**: Use `useFormState` + `useFormStatus` for server action forms

## Checklist

- [ ] Schema defined with clear error messages
- [ ] Client-side validation via zodResolver
- [ ] Server-side validation in action/endpoint
- [ ] Error messages displayed per field
- [ ] Submit button disabled while submitting
- [ ] Form accessible (labels, ARIA, keyboard nav)
