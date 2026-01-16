# Logging Quick Reference Card

Quick guide for using structured logging instead of console statements.

## Import

```typescript
import { logger } from '@acme/shared-utils'
```

## Replace Console Statements

| Don't Use | Use Instead | When |
|-----------|-------------|------|
| `console.log()` | `logger.info()` | Important events |
| `console.error()` | `logger.error()` | Errors that need attention |
| `console.warn()` | `logger.warn()` | Potential issues |
| `console.debug()` | `logger.debug()` | Development info only |

## Examples

```typescript
// ❌ Before
console.log('User logged in', userId)
console.error('Failed:', error)
console.warn('Missing config')

// ✅ After
logger.info('User logged in', { userId })
logger.error('Failed to process', { error: error.message, stack: error.stack })
logger.warn('Config missing', { key: 'API_KEY', using: 'fallback' })
```

## Log Levels

- **error**: Exceptions, failures, security events
- **warn**: Deprecations, fallbacks, missing optional config
- **info**: User actions, state changes, completed operations
- **debug**: Detailed flow, variables (auto-hidden in production)

## Best Practices

✅ **Do:**
- Include relevant context as objects
- Use descriptive messages
- Log at system boundaries (API routes, services)
- Preserve error stack traces

❌ **Don't:**
- Log sensitive data (passwords, tokens, PII)
- Use console.log in source code
- Log without context
- Mix logging levels inappropriately

## Context Example

```typescript
logger.error('Payment failed', {
  orderId: order.id,
  amount: order.total,
  error: error.message,
  stack: error.stack,
  retryCount: 3,
})
```

## Environment

```bash
# Development - verbose output
LOG_LEVEL=debug pnpm dev

# Production - structured JSON
LOG_LEVEL=info pnpm start
```

## When Console is OK

- Build scripts (`scripts/*.ts`)
- Test utilities (`__tests__/*.ts`)
- Temporary debugging (remove before commit)

## Full Documentation

See [docs/logging.md](./logging.md) for complete guide.
