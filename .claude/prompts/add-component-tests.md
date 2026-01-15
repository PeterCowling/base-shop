# Add Component Tests

## Context
Write comprehensive tests for React components using Testing Library and Jest.

## Prerequisites
- Component to test: `{{componentPath}}`
- Testing library: `@testing-library/react`
- Test runner: Jest
- Accessibility testing: `jest-axe`

## Testing Philosophy

**What to test:**
- ✅ User-visible behavior
- ✅ Component renders correctly with props
- ✅ User interactions work
- ✅ Accessibility
- ✅ Edge cases and error states

**What NOT to test:**
- ❌ Implementation details (state variable names, etc.)
- ❌ Internal helper functions (test them separately)
- ❌ Third-party library internals
- ❌ CSS/styling (unless it affects behavior)

## Workflow

### 1. Read Component
```bash
# Read the component first
```
Use Read tool on the component file.

Identify:
- [ ] Props and their types
- [ ] User interactions (clicks, typing, etc.)
- [ ] Conditional rendering
- [ ] Async operations
- [ ] External dependencies (hooks, context)

### 2. Create Test File Structure

**Location:** Same directory as component
**Name:** `{{ComponentName}}.test.tsx`

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { {{ComponentName}} } from './{{ComponentName}}'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

describe('{{ComponentName}}', () => {
  // Tests go here
})
```

### 3. Add Rendering Tests

**Basic render:**
```tsx
it('renders without crashing', () => {
  render(<{{ComponentName}} />)
})

it('renders with required props', () => {
  render(<{{ComponentName}} title="Test Title" />)
  expect(screen.getByText('Test Title')).toBeInTheDocument()
})

it('renders children correctly', () => {
  render(
    <{{ComponentName}}>
      <span>Child content</span>
    </{{ComponentName}}>
  )
  expect(screen.getByText('Child content')).toBeInTheDocument()
})
```

**Conditional rendering:**
```tsx
it('shows loading state', () => {
  render(<{{ComponentName}} isLoading />)
  expect(screen.getByRole('progressbar')).toBeInTheDocument()
})

it('shows error state', () => {
  render(<{{ComponentName}} error="Something went wrong" />)
  expect(screen.getByText('Something went wrong')).toBeInTheDocument()
})

it('hides optional content when prop is false', () => {
  render(<{{ComponentName}} showOptional={false} />)
  expect(screen.queryByTestId('optional-content')).not.toBeInTheDocument()
})
```

### 4. Add Interaction Tests

**Click events:**
```tsx
it('calls onClick when clicked', async () => {
  const handleClick = jest.fn()
  render(<{{ComponentName}} onClick={handleClick} />)

  const button = screen.getByRole('button', { name: /click me/i })
  await userEvent.click(button)

  expect(handleClick).toHaveBeenCalledTimes(1)
})

it('disables button when disabled prop is true', async () => {
  const handleClick = jest.fn()
  render(<{{ComponentName}} onClick={handleClick} disabled />)

  const button = screen.getByRole('button')
  await userEvent.click(button)

  expect(handleClick).not.toHaveBeenCalled()
  expect(button).toBeDisabled()
})
```

**Form inputs:**
```tsx
it('updates input value on change', async () => {
  const handleChange = jest.fn()
  render(<{{ComponentName}} onChange={handleChange} />)

  const input = screen.getByRole('textbox', { name: /email/i })
  await userEvent.type(input, 'test@example.com')

  expect(input).toHaveValue('test@example.com')
  expect(handleChange).toHaveBeenCalled()
})

it('submits form with correct data', async () => {
  const handleSubmit = jest.fn()
  render(<{{ComponentName}} onSubmit={handleSubmit} />)

  await userEvent.type(
    screen.getByRole('textbox', { name: /email/i }),
    'test@example.com'
  )
  await userEvent.click(screen.getByRole('button', { name: /submit/i }))

  await waitFor(() => {
    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com'
    })
  })
})
```

**Keyboard interactions:**
```tsx
it('handles keyboard navigation', async () => {
  render(<{{ComponentName}} />)

  const button = screen.getByRole('button')

  // Tab to focus
  await userEvent.tab()
  expect(button).toHaveFocus()

  // Enter to activate
  await userEvent.keyboard('{Enter}')
  // Assert expected behavior
})

it('closes on Escape key', async () => {
  render(<{{ComponentName}} isOpen />)

  expect(screen.getByRole('dialog')).toBeInTheDocument()

  await userEvent.keyboard('{Escape}')

  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
```

### 5. Add Async Tests

**Loading states:**
```tsx
it('shows loading state while fetching data', async () => {
  const mockFetch = jest.fn(() =>
    new Promise(resolve => setTimeout(() => resolve({ data: [] }), 100))
  )

  render(<{{ComponentName}} fetchData={mockFetch} />)

  // Loading state appears
  expect(screen.getByText(/loading/i)).toBeInTheDocument()

  // Wait for data to load
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
  })
})
```

**Error handling:**
```tsx
it('displays error message on fetch failure', async () => {
  const mockFetch = jest.fn(() =>
    Promise.reject(new Error('Network error'))
  )

  render(<{{ComponentName}} fetchData={mockFetch} />)

  await waitFor(() => {
    expect(screen.getByText(/network error/i)).toBeInTheDocument()
  })
})
```

### 6. Add Accessibility Tests

**Basic a11y:**
```tsx
it('has no accessibility violations', async () => {
  const { container } = render(<{{ComponentName}} />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})

it('has proper ARIA labels', () => {
  render(<{{ComponentName}} />)

  const button = screen.getByRole('button', { name: /submit form/i })
  expect(button).toHaveAttribute('aria-label', 'Submit form')
})

it('announces loading state to screen readers', () => {
  render(<{{ComponentName}} isLoading />)

  expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
})
```

**Keyboard accessibility:**
```tsx
it('is keyboard accessible', async () => {
  render(<{{ComponentName}} />)

  // Tab through interactive elements
  await userEvent.tab()
  expect(screen.getByRole('button', { name: /first/i })).toHaveFocus()

  await userEvent.tab()
  expect(screen.getByRole('button', { name: /second/i })).toHaveFocus()
})
```

### 7. Add Edge Case Tests

```tsx
it('handles empty data gracefully', () => {
  render(<{{ComponentName}} data={[]} />)
  expect(screen.getByText(/no items found/i)).toBeInTheDocument()
})

it('handles null values', () => {
  render(<{{ComponentName}} title={null} />)
  // Should not crash
  expect(screen.getByRole('heading')).toBeInTheDocument()
})

it('handles very long strings', () => {
  const longString = 'a'.repeat(1000)
  render(<{{ComponentName}} title={longString} />)
  expect(screen.getByText(longString)).toBeInTheDocument()
})

it('handles special characters', () => {
  render(<{{ComponentName}} title="Title with <script>alert('xss')</script>" />)
  // Should escape HTML
  expect(screen.getByText(/Title with/)).toBeInTheDocument()
})
```

### 8. Mock Dependencies

**Mock context:**
```tsx
import { AuthProvider } from '@/context/AuthContext'

it('uses auth context', () => {
  const mockUser = { id: '1', name: 'Test User' }

  render(
    <AuthProvider value={{ user: mockUser, isLoading: false }}>
      <{{ComponentName}} />
    </AuthProvider>
  )

  expect(screen.getByText('Test User')).toBeInTheDocument()
})
```

**Mock hooks:**
```tsx
import * as useDataHook from '@/hooks/useData'

it('fetches and displays data', async () => {
  jest.spyOn(useDataHook, 'useData').mockReturnValue({
    data: [{ id: 1, name: 'Item 1' }],
    isLoading: false,
    error: null
  })

  render(<{{ComponentName}} />)

  expect(screen.getByText('Item 1')).toBeInTheDocument()
})
```

**Mock API calls:**
```tsx
import { server } from '@/mocks/server'
import { rest } from 'msw'

it('displays fetched data', async () => {
  server.use(
    rest.get('/api/data', (req, res, ctx) => {
      return res(ctx.json([{ id: 1, name: 'Test' }]))
    })
  )

  render(<{{ComponentName}} />)

  await waitFor(() => {
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

## Quality Checks

```bash
# Run tests
pnpm --filter @acme/ui test -- --testPathPattern {{ComponentName}}

# Run with coverage
pnpm --filter @acme/ui test -- --coverage --testPathPattern {{ComponentName}}

# Watch mode for development
pnpm --filter @acme/ui test -- --watch --testPathPattern {{ComponentName}}
```

**Coverage targets:**
- [ ] Statements: > 80%
- [ ] Branches: > 75%
- [ ] Functions: > 80%
- [ ] Lines: > 80%

**Checklist:**
- [ ] All props tested
- [ ] All user interactions tested
- [ ] Loading/error states tested
- [ ] Accessibility checked with jest-axe
- [ ] Edge cases covered
- [ ] Async operations tested with waitFor
- [ ] No implementation details tested
- [ ] Tests are readable and maintainable

## Common Mistakes

❌ **Testing implementation details:**
```tsx
// BAD - testing internal state
it('sets loading to true', () => {
  const { result } = renderHook(() => useData())
  expect(result.current.loading).toBe(true)
})
```

❌ **Not using user-event:**
```tsx
// BAD - using fireEvent
fireEvent.click(button)

// GOOD - using userEvent
await userEvent.click(button)
```

❌ **Not waiting for async:**
```tsx
// BAD - not waiting
it('displays data', () => {
  render(<AsyncComponent />)
  expect(screen.getByText('Data')).toBeInTheDocument() // Fails!
})

// GOOD - using waitFor
it('displays data', async () => {
  render(<AsyncComponent />)
  await waitFor(() => {
    expect(screen.getByText('Data')).toBeInTheDocument()
  })
})
```

❌ **Using queryBy when expecting element:**
```tsx
// BAD
expect(screen.queryByText('Title')).toBeInTheDocument()

// GOOD
expect(screen.getByText('Title')).toBeInTheDocument()
```

❌ **Not cleaning up:**
```tsx
// BAD - timers not cleaned
it('updates after delay', () => {
  setTimeout(() => {}, 1000)
  // Test ends but timer still running
})

// GOOD
it('updates after delay', async () => {
  jest.useFakeTimers()
  render(<Component />)
  jest.runAllTimers()
  jest.useRealTimers()
})
```

## Test Organization

**Describe blocks:**
```tsx
describe('{{ComponentName}}', () => {
  describe('rendering', () => {
    it('renders with default props', () => {})
    it('renders with custom props', () => {})
  })

  describe('interactions', () => {
    it('handles click events', () => {})
    it('handles keyboard events', () => {})
  })

  describe('edge cases', () => {
    it('handles empty data', () => {})
    it('handles null values', () => {})
  })

  describe('accessibility', () => {
    it('has no violations', () => {})
    it('is keyboard accessible', () => {})
  })
})
```

## Related
- [Testing documentation](../../__tests__/docs/testing.md)
- [Jest setup](../../jest.setup.ts)
- [Testing Library docs](https://testing-library.com/docs/react-testing-library/intro/)
