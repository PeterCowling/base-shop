# Add Form Validation

## Context
Add client and server-side form validation using Zod and react-hook-form.

## Prerequisites
- Form component: `{{formName}}`
- Libraries: `zod`, `react-hook-form`, `@hookform/resolvers`
- Location: `{{componentPath}}`

## Tech Stack

- **Zod** - Schema validation
- **react-hook-form** - Form state management
- **@hookform/resolvers/zod** - Zod integration
- **Server Actions** - Server-side validation

## Workflow

### 1. Install Dependencies

```bash
pnpm add zod react-hook-form @hookform/resolvers
```

### 2. Define Zod Schema

**Create schema file:**
`schemas/{{formName}}.ts`

```typescript
import { z } from 'zod'

export const {{formName}}Schema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),

  email: z
    .string()
    .email('Invalid email address'),

  age: z
    .number()
    .int('Age must be a whole number')
    .positive('Age must be positive')
    .max(120, 'Age must be less than 120')
    .optional(),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  confirmPassword: z.string(),

  terms: z
    .boolean()
    .refine((val) => val === true, 'You must accept the terms'),

  role: z.enum(['user', 'admin', 'moderator']),

  tags: z
    .array(z.string())
    .min(1, 'Select at least one tag')
    .max(5, 'Maximum 5 tags allowed'),
})
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// Export type
export type {{FormName}}Input = z.infer<typeof {{formName}}Schema>
```

### 3. Create Form Component

**Basic form with react-hook-form:**
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { {{formName}}Schema, type {{FormName}}Input } from '@/schemas/{{formName}}'

export function {{FormName}}() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{{FormName}}Input>({
    resolver: zodResolver({{formName}}Schema),
    defaultValues: {
      name: '',
      email: '',
      role: 'user',
    },
  })

  const onSubmit = async (data: {{FormName}}Input) => {
    try {
      // Call server action or API
      const result = await submitForm(data)

      if (result.success) {
        // Handle success
        console.log('Form submitted successfully')
      }
    } catch (error) {
      console.error('Form submission failed:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name field */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Email field */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}
```

### 4. Add Reusable Form Components

**Form Field Component:**
```typescript
interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password' | 'number'
  register: UseFormRegister<any>
  error?: FieldError
  placeholder?: string
}

export function FormField({
  label,
  name,
  type = 'text',
  register,
  error,
  placeholder,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        type={type}
        {...register(name)}
        placeholder={placeholder}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
          error && 'border-destructive focus-visible:ring-destructive'
        )}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  )
}
```

**Usage:**
```typescript
<FormField
  label="Name"
  name="name"
  register={register}
  error={errors.name}
  placeholder="Enter your name"
/>
```

### 5. Advanced Validation Patterns

**Async validation:**
```typescript
const emailSchema = z.string().email().refine(
  async (email) => {
    // Check if email is already taken
    const exists = await checkEmailExists(email)
    return !exists
  },
  {
    message: 'Email is already taken',
  }
)
```

**Conditional validation:**
```typescript
const userSchema = z
  .object({
    type: z.enum(['individual', 'business']),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    businessName: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'individual') {
        return !!data.firstName && !!data.lastName
      }
      return !!data.businessName
    },
    {
      message: 'Please provide required fields based on type',
    }
  )
```

**Custom validation:**
```typescript
const ageSchema = z.number().refine(
  (age) => {
    const today = new Date()
    const birthYear = today.getFullYear() - age
    return birthYear >= 1900 && birthYear <= today.getFullYear()
  },
  {
    message: 'Please enter a valid age',
  }
)
```

### 6. Watch and Control Fields

**Watch field values:**
```typescript
const { watch } = useForm()
const watchType = watch('type')

return (
  <form>
    <select {...register('type')}>
      <option value="individual">Individual</option>
      <option value="business">Business</option>
    </select>

    {watchType === 'individual' && (
      <>
        <input {...register('firstName')} placeholder="First Name" />
        <input {...register('lastName')} placeholder="Last Name" />
      </>
    )}

    {watchType === 'business' && (
      <input {...register('businessName')} placeholder="Business Name" />
    )}
  </form>
)
```

**Controlled inputs:**
```typescript
const { control } = useForm()

<Controller
  name="dateOfBirth"
  control={control}
  render={({ field }) => (
    <DatePicker
      selected={field.value}
      onChange={field.onChange}
      dateFormat="yyyy-MM-dd"
    />
  )}
/>
```

### 7. Server-Side Validation

**In Server Action:**
```typescript
'use server'

import { {{formName}}Schema } from '@/schemas/{{formName}}'

export async function submitForm(data: unknown) {
  // Server-side validation
  const result = {{formName}}Schema.safeParse(data)

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    }
  }

  try {
    // Process validated data
    const user = await db.user.create({
      data: result.data,
    })

    return { success: true, data: user }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to submit form'
    }
  }
}
```

**Handle server errors in client:**
```typescript
'use client'

const onSubmit = async (data: FormInput) => {
  const result = await submitForm(data)

  if (!result.success && result.errors) {
    // Set server-side errors on form
    Object.entries(result.errors).forEach(([field, messages]) => {
      setError(field as any, {
        type: 'server',
        message: messages?.[0],
      })
    })
  }
}
```

### 8. Form with Server Actions

**Progressive enhancement:**
```typescript
'use client'

import { useFormState } from 'react-dom'
import { createUser } from './actions'

export function CreateUserForm() {
  const [state, formAction] = useFormState(createUser, { errors: {} })

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          required
          className="flex h-10 w-full rounded-md border"
        />
        {state.errors?.name && (
          <p className="text-sm text-destructive">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="flex h-10 w-full rounded-md border"
        />
        {state.errors?.email && (
          <p className="text-sm text-destructive">{state.errors.email[0]}</p>
        )}
      </div>

      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create User'}
    </button>
  )
}
```

### 9. Array and Nested Fields

**Dynamic field arrays:**
```typescript
const { control, register } = useForm()
const { fields, append, remove } = useFieldArray({
  control,
  name: 'items',
})

return (
  <form>
    {fields.map((field, index) => (
      <div key={field.id} className="flex gap-2">
        <input {...register(`items.${index}.name`)} />
        <input {...register(`items.${index}.quantity`)} type="number" />
        <button type="button" onClick={() => remove(index)}>
          Remove
        </button>
      </div>
    ))}

    <button
      type="button"
      onClick={() => append({ name: '', quantity: 0 })}
    >
      Add Item
    </button>
  </form>
)
```

**Nested objects:**
```typescript
const schema = z.object({
  user: z.object({
    name: z.string(),
    email: z.string().email(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      zip: z.string(),
    }),
  }),
})

// In form
<input {...register('user.name')} />
<input {...register('user.email')} />
<input {...register('user.address.street')} />
<input {...register('user.address.city')} />
<input {...register('user.address.zip')} />
```

### 10. Reset and Default Values

**Reset form:**
```typescript
const { reset } = useForm()

// Reset to default values
<button type="button" onClick={() => reset()}>
  Reset
</button>

// Reset to specific values
<button type="button" onClick={() => reset({ name: '', email: '' })}>
  Clear
</button>
```

**Dynamic default values:**
```typescript
const { reset } = useForm()

useEffect(() => {
  if (user) {
    reset({
      name: user.name,
      email: user.email,
    })
  }
}, [user, reset])
```

## Quality Checks

```bash
# Type checking
pnpm typecheck

# Test form validation
pnpm --filter {{package}} test -- --testPathPattern {{formName}}
```

**Manual checks:**
- [ ] Client-side validation works
- [ ] Server-side validation works
- [ ] Error messages are clear
- [ ] Required fields marked
- [ ] Async validation if needed
- [ ] Progressive enhancement
- [ ] Accessible (ARIA labels, error announcements)
- [ ] Works with keyboard navigation
- [ ] Submit button disabled while submitting
- [ ] Form resets after successful submission

## Common Patterns

**Login form:**
```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})
```

**Registration form:**
```typescript
const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })
```

**Contact form:**
```typescript
const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(3),
  message: z.string().min(10).max(500),
})
```

## Common Mistakes

❌ **No server-side validation:**
```typescript
// ❌ Only client validation
function onSubmit(data) {
  await db.create(data) // Unsafe!
}
```

❌ **Not handling errors:**
```typescript
// ❌ Errors not displayed
{errors.email && <p>{errors.email.message}</p>}
// Should handle undefined
```

❌ **Missing required validation:**
```typescript
// ❌ Optional fields that should be required
const schema = z.object({
  email: z.string().email().optional(), // Should be required!
})
```

## Related
- [Server Actions](./create-server-action.md)
- [Component Testing](./add-component-tests.md)
- [Zod documentation](https://zod.dev/)
- [react-hook-form documentation](https://react-hook-form.com/)
