# Refactor Component

## Context
Refactor an existing component to improve maintainability, performance, or follow better patterns.

## Prerequisites
- Component: `{{componentPath}}`
- Refactoring goal: `{{goal}}`

## Common Refactoring Goals

1. Extract reusable logic
2. Simplify complex conditionals
3. Improve performance
4. Better type safety
5. Follow atomic design hierarchy
6. Use design tokens instead of arbitrary values

## Workflow

### 1. Read and Understand
- Read the current component
- Identify pain points
- Check test coverage
- Note dependencies

### 2. Extract Custom Hooks

**Before:**
```typescript
export function UserList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/users')
      .then(res => res.json())
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <ul>{users.map(/* ... */)}</ul>
}
```

**After:**
```typescript
// hooks/useUsers.ts
export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/users')
      .then(res => res.json())
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { users, loading, error }
}

// Component
export function UserList() {
  const { users, loading, error } = useUsers()

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />

  return <ul>{users.map(/* ... */)}</ul>
}
```

### 3. Split Large Components

**Extract sub-components:**
```typescript
// Before - all in one
export function ProductCard({ product }) {
  return (
    <div>
      <img src={product.image} />
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <div>
        <span>${product.price}</span>
        <button>Add to Cart</button>
      </div>
    </div>
  )
}

// After - atomic components
export function ProductCard({ product }) {
  return (
    <Card>
      <ProductImage src={product.image} alt={product.name} />
      <ProductInfo name={product.name} description={product.description} />
      <ProductActions price={product.price} onAddToCart={() => {}} />
    </Card>
  )
}
```

### 4. Simplify Conditional Rendering

**Before:**
```typescript
export function Status({ status }) {
  return (
    <div>
      {status === 'pending' && <Badge color="yellow">Pending</Badge>}
      {status === 'approved' && <Badge color="green">Approved</Badge>}
      {status === 'rejected' && <Badge color="red">Rejected</Badge>}
    </div>
  )
}
```

**After:**
```typescript
const statusConfig = {
  pending: { color: 'yellow', label: 'Pending' },
  approved: { color: 'green', label: 'Approved' },
  rejected: { color: 'red', label: 'Rejected' },
} as const

export function Status({ status }: { status: keyof typeof statusConfig }) {
  const config = statusConfig[status]
  return <Badge color={config.color}>{config.label}</Badge>
}
```

### 5. Apply Design Tokens

**Before:**
```typescript
export function Alert({ type }) {
  return (
    <div className="p-[16px] rounded-[8px] bg-[#FF0000] text-[#FFFFFF]">
      {/* content */}
    </div>
  )
}
```

**After:**
```typescript
export function Alert({ variant = 'error' }) {
  return (
    <div className={cn(
      'p-4 rounded-md',
      {
        'bg-destructive text-destructive-foreground': variant === 'error',
        'bg-primary text-primary-foreground': variant === 'info',
      }
    )}>
      {/* content */}
    </div>
  )
}
```

### 6. Improve Type Safety

**Before:**
```typescript
export function UserCard({ user }) {
  return <div>{user.name}</div>
}
```

**After:**
```typescript
interface User {
  id: string
  name: string
  email: string
}

interface UserCardProps {
  user: User
  onEdit?: (user: User) => void
}

export function UserCard({ user, onEdit }: UserCardProps) {
  return <div>{user.name}</div>
}
```

### 7. Memoization for Performance

**Before:**
```typescript
export function ExpensiveList({ items, filter }) {
  const filtered = items.filter(item => item.type === filter)
  const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name))

  return sorted.map(item => <Item key={item.id} {...item} />)
}
```

**After:**
```typescript
export function ExpensiveList({ items, filter }) {
  const processedItems = useMemo(() => {
    return items
      .filter(item => item.type === filter)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [items, filter])

  return processedItems.map(item => <Item key={item.id} {...item} />)
}

// Memoize the Item component
const Item = memo(({ id, name, type }) => {
  return <div>{name}</div>
})
```

### 8. Use Composition over Props

**Before:**
```typescript
export function Modal({
  isOpen,
  title,
  content,
  footer,
  onClose
}) {
  return (
    <div>
      <h2>{title}</h2>
      <div>{content}</div>
      <div>{footer}</div>
    </div>
  )
}
```

**After:**
```typescript
export function Modal({ isOpen, onClose, children }) {
  return <div>{children}</div>
}

Modal.Header = function ModalHeader({ children }) {
  return <header>{children}</header>
}

Modal.Body = function ModalBody({ children }) {
  return <div>{children}</div>
}

Modal.Footer = function ModalFooter({ children }) {
  return <footer>{children}</footer>
}

// Usage
<Modal isOpen={isOpen} onClose={onClose}>
  <Modal.Header>Title</Modal.Header>
  <Modal.Body>Content</Modal.Body>
  <Modal.Footer>Actions</Modal.Footer>
</Modal>
```

## Quality Checks

- [ ] Tests still pass
- [ ] No regression in functionality
- [ ] Better type safety
- [ ] Improved readability
- [ ] Follows architectural patterns
- [ ] Uses design tokens
- [ ] Better performance if that was the goal

## Related
- [Create UI Component](./create-ui-component.md)
- [Apply Design System](./apply-design-system.md)
- [Add Component Tests](./add-component-tests.md)
