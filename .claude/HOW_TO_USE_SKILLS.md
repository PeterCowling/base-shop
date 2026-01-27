# How to Use Claude Skills

## Quick Start

The skills in this repo are **workflow playbooks** (Markdown docs) that Claude can follow to apply your documented patterns consistently.

## Method 1: Direct Skill Reference (Recommended)

Simply mention the skill by name in your request to Claude:

```
"Use the create-ui-component skill to create a Button atom in packages/ui"
```

```
"Follow the add-form-validation skill to add validation to the login form"
```

```
"Apply the migrate-to-app-router skill to convert apps/reception/src/pages/dashboard.tsx"
```

Claude will:
1. Read the skill doc from `.claude/skills/<skill>/SKILL.md`
2. Follow the workflow defined in the skill
3. Apply the patterns and conventions
4. Run the quality checks

## Method 2: Natural Language (Claude Infers)

Claude can also infer which skill to use based on your request:

```
"Create a Card component in packages/ui following atomic design"
→ Claude uses: create-ui-component
```

```
"Add a server action for creating products"
→ Claude uses: create-server-action
```

```
"Write tests for the ProductCard component"
→ Claude uses: add-component-tests
```

## Method 3: Combined Skills

You can reference multiple skills for complex tasks:

```
"Use create-ui-component to make a LoginForm molecule,
then add-form-validation for the email/password fields,
and add-component-tests to test it"
```

Claude will execute each skill in sequence.

---

## Real-World Examples

### Example 1: Creating a New Component

**You say:**
```
"Use the create-ui-component skill to create a PriceTag atom.
It should display a price with currency symbol and optional discount badge.
Props: price (number), currency (string), discount (optional number)"
```

**Claude will:**
1. ✅ Read `.claude/skills/create-ui-component/SKILL.md`
2. ✅ Create file in `packages/ui/components/atoms/price-tag/`
3. ✅ Follow atomic design principles
4. ✅ Use design tokens (no arbitrary values)
5. ✅ Add proper TypeScript types
6. ✅ Include forwardRef for ref handling
7. ✅ Export from barrel files
8. ✅ Run quality checks (typecheck, lint)

**Result:**
```tsx
// packages/ui/components/atoms/price-tag/PriceTag.tsx
import { forwardRef, type ElementRef, type ComponentPropsWithoutRef } from 'react'
import { cn } from '@repo/ui/utils'

export interface PriceTagProps extends ComponentPropsWithoutRef<'div'> {
  price: number
  currency: string
  discount?: number
}

export const PriceTag = forwardRef<ElementRef<'div'>, PriceTagProps>(
  ({ className, price, currency, discount, ...props }, ref) => {
    const displayPrice = discount
      ? (price * (1 - discount / 100)).toFixed(2)
      : price.toFixed(2)

    return (
      <div
        ref={ref}
        className={cn('flex items-baseline gap-2', className)}
        {...props}
      >
        <span className="text-lg font-semibold text-foreground">
          {currency}{displayPrice}
        </span>
        {discount && (
          <span className="text-sm text-muted-foreground line-through">
            {currency}{price.toFixed(2)}
          </span>
        )}
        {discount && (
          <span className="rounded-sm bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
            -{discount}%
          </span>
        )}
      </div>
    )
  }
)

PriceTag.displayName = 'PriceTag'
```

### Example 2: Adding Form Validation

**You say:**
```
"Use add-form-validation to add validation to the user registration form.
Required fields: email, password, confirmPassword, firstName, lastName.
Password must be 8+ chars with uppercase, lowercase, and number."
```

**Claude will:**
1. ✅ Read `.claude/skills/add-form-validation/SKILL.md`
2. ✅ Create Zod schema with specified rules
3. ✅ Set up react-hook-form with zodResolver
4. ✅ Add client-side validation
5. ✅ Create server action with server-side validation
6. ✅ Handle error display
7. ✅ Add accessibility attributes

**Result:**
```typescript
// schemas/registration.ts
import { z } from 'zod'

export const registrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type RegistrationInput = z.infer<typeof registrationSchema>
```

### Example 3: Migration Task

**You say:**
```
"Use migrate-to-app-router to convert apps/reception/src/pages/products/[id].tsx
to the App Router. It fetches product data and has a review submission form."
```

**Claude will:**
1. ✅ Read `.claude/skills/migrate-to-app-router/SKILL.md`
2. ✅ Analyze the Pages Router file
3. ✅ Create new App Router structure
4. ✅ Convert data fetching to Server Components
5. ✅ Extract client components for interactivity
6. ✅ Migrate dynamic routes
7. ✅ Update metadata
8. ✅ Test the migration

**Result:**
```
apps/reception/src/app/products/[id]/
├── page.tsx              # Server Component (data fetching)
├── ReviewForm.tsx        # Client Component (form)
└── loading.tsx           # Loading state
```

### Example 4: Refactoring Existing Code

**You say:**
```
"Use refactor-component on apps/cms/src/components/ProductList.tsx.
Extract the filtering logic to a custom hook and split the ProductCard into smaller components."
```

**Claude will:**
1. ✅ Read `.claude/skills/refactor-component/SKILL.md`
2. ✅ Read the current component
3. ✅ Identify pain points
4. ✅ Extract `useProductFilters` hook
5. ✅ Split ProductCard into atomic components
6. ✅ Apply design tokens
7. ✅ Ensure tests still pass

---

## Skill Chaining for Complex Tasks

For larger features, chain multiple skills:

**You say:**
```
"I need to add a product review system. Use:
1. create-prisma-model for Review and ReviewVote models
2. create-server-action for submitReview and voteOnReview
3. create-ui-component for ReviewCard molecule
4. add-form-validation for the review submission form
5. add-component-tests for ReviewCard
6. add-e2e-test for the full review submission flow"
```

Claude will execute each skill sequentially, building the complete feature.

---

## Integration with Your Workflow

### Daily Development

**Before:**
```
"Create a button component"
→ Claude might not follow your conventions
→ Arbitrary Tailwind values
→ Missing accessibility
→ Inconsistent file structure
```

**Now:**
```
"Use create-ui-component to create a Button atom"
→ Claude follows your atomic design hierarchy
→ Uses design tokens
→ Includes accessibility
→ Proper file structure in packages/ui
→ Includes tests
→ Exports correctly
```

### Code Reviews

**Before starting work:**
```
"Before I start, use refactor-component to review ProductCard.tsx
and suggest improvements based on our conventions"
```

### Onboarding

Share skills with new team members:
```
"New developer? Start by reading docs/agents/feature-workflow-guide.md
and .claude/SKILLS_INDEX.md to understand our development patterns"
```

---

## How Skills Work Behind the Scenes

### 1. Skill Files are Markdown Templates

Each skill lives in `.claude/skills/<skill>/SKILL.md` and contains:
- **Context**: When to use the skill
- **Prerequisites**: What's needed
- **Workflow**: Step-by-step instructions
- **Code Examples**: Real patterns from your repo
- **Quality Checks**: Commands to verify success
- **Common Mistakes**: Anti-patterns to avoid

### 2. Claude Reads and Applies

When you reference a skill, Claude:
1. Reads the skill template
2. Understands the context and patterns
3. Applies the workflow to your specific request
4. Follows the conventions defined in the skill
5. Runs the quality checks

### 3. Skills Reference Core Docs

Skills automatically reference your main documentation:
- `CLAUDE.md` - Architecture and conventions
- `docs/architecture.md` - UI hierarchy and package layering
- `docs/development.md` - Commands and workflows
- `.claude/config.json` - Context files

---

## Customizing Skills for Your Needs

### Override Defaults

You can override any aspect of a skill:

```
"Use create-ui-component to create a Button atom,
but use Radix UI primitives instead of building from scratch"
```

Claude will follow the skill but adapt to your override.

### Add Project Context

```
"Use create-server-action for createOrder.
This needs to integrate with our Stripe payment flow
and send confirmation emails via our email service."
```

Claude combines the skill template with your specific requirements.

### Specify Location

```
"Use create-ui-component to create a ProductFilter molecule
in packages/ui/components/molecules/product-filter/"
```

---

## Available Skills Reference

### ✅ Implemented (11 Skills)

1. **create-ui-component** - Create atomic design components
   - Use for: Any UI component (atoms → organisms)
   - Example: `"Use create-ui-component to create a Badge atom"`

2. **migrate-to-app-router** - Convert Pages Router → App Router
   - Use for: Reception migration, modernizing routes
   - Example: `"Use migrate-to-app-router on pages/dashboard.tsx"`

3. **apply-design-system** - Use design tokens correctly
   - Use for: Fixing arbitrary values, applying theme
   - Example: `"Use apply-design-system to fix hardcoded colors in ProductCard"`

4. **add-component-tests** - Write comprehensive tests
   - Use for: Testing React components
   - Example: `"Use add-component-tests for LoginForm"`

5. **create-prisma-model** - Create database models
   - Use for: New tables, relations, indexes
   - Example: `"Use create-prisma-model to create a Review model"`

6. **create-server-action** - Create Next.js server actions
   - Use for: Form submissions, mutations
   - Example: `"Use create-server-action for user registration"`

7. **add-form-validation** - Add Zod + react-hook-form validation
   - Use for: Any form with validation
   - Example: `"Use add-form-validation on checkout form"`

8. **create-api-endpoint** - Create API route handlers
   - Use for: REST APIs, webhooks
   - Example: `"Use create-api-endpoint to create /api/products endpoint"`

9. **refactor-component** - Improve existing components
   - Use for: Code cleanup, performance, conventions
   - Example: `"Use refactor-component to improve ProductList.tsx"`

10. **add-e2e-test** - Create Cypress E2E tests
    - Use for: Critical user flows
    - Example: `"Use add-e2e-test for checkout flow"`

### ⏳ Planned (60+ Skills)

See `.claude/SKILLS_IMPLEMENTATION_STATUS.md` for the full list.

---

## Tips for Best Results

### ✅ Do This

```
✅ "Use create-ui-component to create a ProductCard molecule"
   (Specific skill, clear component type)

✅ "Use add-form-validation to add validation to the login form"
   (Clear target, clear action)

✅ "Use migrate-to-app-router on apps/reception/src/pages/products/index.tsx"
   (Explicit file path)
```

### ❌ Avoid This

```
❌ "Create a component"
   (Too vague, Claude might not follow conventions)

❌ "Add validation"
   (Unclear what to validate, where)

❌ "Fix the app"
   (Too broad, no clear skill to apply)
```

### Best Practices

1. **Be specific about the skill**: Mention it by name
2. **Provide context**: What you're building, where it goes
3. **Include requirements**: Props, validation rules, behavior
4. **Reference related work**: "Like ProductCard but for users"
5. **Ask for quality checks**: "Run tests after creation"

---

## Troubleshooting

### "Claude isn't following the pattern"

**Solution:** Be explicit about the skill:
```
❌ "Create a button"
✅ "Use create-ui-component skill to create a Button atom"
```

### "Claude is using arbitrary values"

**Solution:** Reference the design system skill:
```
"Use apply-design-system to ensure all Tailwind classes use design tokens"
```

### "Tests aren't comprehensive enough"

**Solution:** Reference the testing skill:
```
"Use add-component-tests to write comprehensive tests covering
render, interactions, accessibility, and edge cases"
```

### "Migration doesn't follow Next.js 15 patterns"

**Solution:** Be explicit about the migration skill:
```
"Use migrate-to-app-router skill to convert this to App Router
with Server Components and proper data fetching"
```

---

## Next Steps

### Start Using Skills Today

1. **Pick a task** you need to do
2. **Find the relevant skill** in `.claude/SKILLS_IMPLEMENTATION_STATUS.md`
3. **Reference it explicitly** in your Claude request
4. **Review the output** to ensure it followed the pattern
5. **Provide feedback** if adjustments are needed

### Example First Tasks

```
1. "Use create-ui-component to create an Avatar atom in packages/ui"

2. "Use add-form-validation to add validation to the contact form"

3. "Use create-server-action to create a server action for newsletter signup"

4. "Use add-component-tests to write tests for the Button component"
```

### Expand the Skills Library

As you encounter new patterns:
1. Document them as a new skill
2. Add as `.claude/skills/<skill>/SKILL.md` (new folder)
3. Update `SKILLS_IMPLEMENTATION_STATUS.md`
4. Reference the new skill in future work

---

## Summary

**Skills = Reusable workflow playbooks**

- Store your team's conventions and patterns
- Ensure consistency across the codebase
- Speed up development with proven workflows
- Onboard new developers faster
- Improve code quality automatically

**To use:** Just say `"Use [skill-name] to [task]"` and Claude will follow your documented patterns!

Start using them in your next Claude conversation to see the difference in code quality and consistency.
