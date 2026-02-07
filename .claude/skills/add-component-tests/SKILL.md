---
name: add-component-tests
description: Write comprehensive React component tests using Testing Library, Jest, and jest-axe. Covers rendering, interactions, async, accessibility, and edge cases.
---

# Add Component Tests

Write tests for React components using Testing Library and Jest.

## Philosophy

**Test:**
- User-visible behavior, rendering with props, interactions, accessibility, edge cases

**Don't test:**
- Implementation details (state names), internal helpers, third-party internals, CSS

## Test File Structure

Location: Same directory as component, named `ComponentName.test.tsx`

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { ComponentName } from './ComponentName'

expect.extend(toHaveNoViolations)

describe('ComponentName', () => {
  describe('rendering', () => {
    it('renders with required props', () => {})
    it('renders children correctly', () => {})
    it('shows loading/error states', () => {})
  })

  describe('interactions', () => {
    it('handles click events', () => {})
    it('handles form input', () => {})
    it('handles keyboard navigation', () => {})
  })

  describe('async', () => {
    it('shows loading while fetching', () => {})
    it('displays error on failure', () => {})
  })

  describe('accessibility', () => {
    it('has no violations', async () => {
      const { container } = render(<ComponentName />)
      expect(await axe(container)).toHaveNoViolations()
    })
  })

  describe('edge cases', () => {
    it('handles empty data', () => {})
    it('handles null/undefined values', () => {})
  })
})
```

## Key Patterns

### Prefer `userEvent` over `fireEvent`
```tsx
// Good
await userEvent.click(button)
await userEvent.type(input, 'text')

// Avoid
fireEvent.click(button)
```

### Use `waitFor` for async assertions
```tsx
await waitFor(() => {
  expect(screen.getByText('Data')).toBeInTheDocument()
})
```

### Query selection
- `getBy*` — element must exist (throws if not)
- `queryBy*` — element may not exist (returns null)
- `findBy*` — async, waits for element

### Mock hooks/context
```tsx
jest.spyOn(useDataHook, 'useData').mockReturnValue({
  data: [...], isLoading: false, error: null
})
```

## Validation

```bash
pnpm --filter <pkg> test -- --testPathPattern ComponentName
pnpm --filter <pkg> test -- --coverage --testPathPattern ComponentName
```

Coverage targets: statements >80%, branches >75%, functions >80%, lines >80%

## Checklist

- [ ] All props tested
- [ ] User interactions tested
- [ ] Loading/error states covered
- [ ] Accessibility checked with jest-axe
- [ ] Edge cases (empty, null, long strings)
- [ ] Async operations use `waitFor`
- [ ] No implementation details tested
