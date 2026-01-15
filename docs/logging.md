# Logging Best Practices

This guide explains how to implement structured logging across the monorepo using the `@acme/shared-utils` logger instead of console statements.

## Why Structured Logging?

**Problems with console.log:**
- ❌ No log levels (info vs error vs debug)
- ❌ No context (request ID, user ID, etc.)
- ❌ Difficult to filter in production
- ❌ No structured data for analysis
- ❌ Mixed with other console output
- ❌ Can't be disabled in production

**Benefits of structured logging:**
- ✅ Log levels for filtering (debug, info, warn, error)
- ✅ Automatic context injection (request ID, etc.)
- ✅ JSON format for log aggregation
- ✅ Environment-aware (verbose in dev, structured in prod)
- ✅ Can be sent to external services (Datadog, Sentry, etc.)
- ✅ Performance-optimized with Pino

---

## Quick Start

### Import the Logger

```typescript
import { logger } from '@acme/shared-utils'
```

### Replace Console Statements

```typescript
// ❌ Bad - Don't use console
console.log('User logged in', userId)
console.error('Failed to fetch data', error)
console.warn('Deprecated API called')

// ✅ Good - Use structured logger
logger.info('User logged in', { userId })
logger.error('Failed to fetch data', { error: error.message, stack: error.stack })
logger.warn('Deprecated API called', { endpoint: '/api/old' })
```

---

## Log Levels

Use the appropriate level for each situation:

### `logger.error()` - Errors that need attention

**When to use:**
- Exceptions and errors
- Failed operations
- Data integrity issues
- Security events

```typescript
try {
  await processPayment(order)
} catch (error) {
  logger.error('Payment processing failed', {
    orderId: order.id,
    error: error.message,
    stack: error.stack,
  })
  throw error
}
```

### `logger.warn()` - Potential issues

**When to use:**
- Deprecated features
- Fallback behavior
- Missing optional configuration
- Performance issues

```typescript
if (!config.OPTIONAL_API_KEY) {
  logger.warn('API key not configured, using fallback', {
    feature: 'analytics',
  })
}
```

### `logger.info()` - Important events

**When to use:**
- Significant state changes
- User actions
- System events
- Completed operations

```typescript
logger.info('Order completed', {
  orderId: order.id,
  amount: order.total,
  customerId: order.customerId,
})
```

### `logger.debug()` - Development information

**When to use:**
- Detailed execution flow
- Variable values during debugging
- Performance metrics
- Developer-only information

```typescript
logger.debug('Cache lookup', {
  key: cacheKey,
  hit: !!cachedValue,
  ttl: ttlSeconds,
})
```

**Note:** Debug logs are automatically disabled in production unless `LOG_LEVEL=debug`.

---

## Best Practices

### 1. Include Relevant Context

```typescript
// ❌ Bad - No context
logger.error('Failed to save')

// ✅ Good - Rich context
logger.error('Failed to save order', {
  orderId: order.id,
  customerId: order.customerId,
  error: error.message,
  retryCount: 3,
})
```

### 2. Don't Log Sensitive Data

The logger automatically filters common PII fields, but be cautious:

```typescript
// ❌ Bad - Contains sensitive data
logger.info('User registered', {
  email: user.email,           // PII
  password: user.password,      // Secret
  creditCard: user.card,        // PII
})

// ✅ Good - Safe logging
logger.info('User registered', {
  userId: user.id,
  plan: user.plan,
  referralSource: user.source,
})
```

**Automatically filtered fields:**
- `password`, `token`, `secret`, `apiKey`
- `email`, `phone`, `address`
- `creditCard`, `ssn`, `dob`

### 3. Log at Boundaries

Log at system boundaries for observability:

```typescript
// API routes
export async function POST(request: Request) {
  logger.info('API request received', {
    endpoint: '/api/orders',
    method: 'POST',
  })

  try {
    const result = await createOrder(data)
    logger.info('Order created successfully', { orderId: result.id })
    return Response.json(result)
  } catch (error) {
    logger.error('Order creation failed', { error: error.message })
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
```

### 4. Use Descriptive Messages

```typescript
// ❌ Bad - Vague
logger.error('Error')
logger.info('Done')

// ✅ Good - Descriptive
logger.error('Failed to connect to database', { host, port })
logger.info('Email sent successfully', { recipient, subject })
```

### 5. Log Errors Properly

```typescript
// ❌ Bad - Loses stack trace
logger.error('Error occurred', { error })

// ✅ Good - Preserves stack trace
logger.error('Error occurred', {
  error: error.message,
  stack: error.stack,
  code: error.code,
})

// ✅ Even better - Helper function
function logError(message: string, error: Error, meta: object = {}) {
  logger.error(message, {
    error: error.message,
    stack: error.stack,
    code: (error as any).code,
    ...meta,
  })
}
```

---

## Environment Configuration

### Development

Verbose logging with pretty-printing:

```bash
LOG_LEVEL=debug
NODE_ENV=development
```

Output:
```
[2026-01-12 10:30:45] INFO: User logged in
  userId: "user_123"
  ip: "192.168.1.1"
```

### Production

Structured JSON logs for aggregation:

```bash
LOG_LEVEL=info
NODE_ENV=production
```

Output:
```json
{"level":"info","time":1673514645000,"msg":"User logged in","userId":"user_123","ip":"192.168.1.1"}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Minimum log level (`debug`, `info`, `warn`, `error`) | `info` (prod), `debug` (dev) |
| `NODE_ENV` | Environment mode | - |

---

## Common Patterns

### API Route Logging

```typescript
// apps/cms/src/app/api/orders/route.ts
import { logger } from '@acme/shared-utils'

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    logger.info('Creating order', { customerId: body.customerId })

    const order = await createOrder(body)

    logger.info('Order created', {
      orderId: order.id,
      duration: Date.now() - startTime,
    })

    return Response.json(order)
  } catch (error) {
    logger.error('Order creation failed', {
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime,
    })
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
```

### Component Error Boundaries

```typescript
// packages/ui/src/components/ErrorBoundary.tsx
import { logger } from '@acme/shared-utils'

class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('React component error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
  }
}
```

### Service Layer Logging

```typescript
// packages/platform-core/src/services/payment.ts
import { logger } from '@acme/shared-utils'

export async function processPayment(order: Order) {
  logger.info('Processing payment', {
    orderId: order.id,
    amount: order.total,
  })

  try {
    const result = await stripe.charges.create(...)

    logger.info('Payment successful', {
      orderId: order.id,
      chargeId: result.id,
    })

    return result
  } catch (error) {
    logger.error('Payment failed', {
      orderId: order.id,
      error: error.message,
      code: error.code,
    })
    throw error
  }
}
```

### Async Operations

```typescript
// Background job logging
async function processQueue() {
  logger.info('Queue processing started')

  for (const job of jobs) {
    logger.debug('Processing job', { jobId: job.id })

    try {
      await processJob(job)
      logger.info('Job completed', { jobId: job.id })
    } catch (error) {
      logger.error('Job failed', {
        jobId: job.id,
        error: error.message,
        retryCount: job.retryCount,
      })
    }
  }

  logger.info('Queue processing finished', { processed: jobs.length })
}
```

---

## ESLint Integration

The monorepo has ESLint rules to enforce proper logging:

```javascript
// eslint.config.mjs
rules: {
  // Warn on console usage (except error/warn for backwards compatibility)
  'no-console': ['warn', { allow: ['error', 'warn'] }],
}
```

### When Console is Acceptable

Console statements are allowed in specific cases:

1. **Build scripts and tooling**
   ```typescript
   // scripts/build.ts - OK
   console.log('Building packages...')
   ```

2. **Test utilities**
   ```typescript
   // __tests__/utils.ts - OK
   console.log('Test setup complete')
   ```

3. **Development-only code**
   ```typescript
   // Only runs in dev
   if (process.env.NODE_ENV === 'development') {
     console.log('Dev mode active') // OK
   }
   ```

4. **Temporary debugging** (remove before commit)
   ```typescript
   // eslint-disable-next-line no-console
   console.log('DEBUG:', data) // Remove this!
   ```

---

## Migration Guide

### Find Console Statements

```bash
# Find all console statements in source code (excluding tests)
grep -r "console\.\(log\|error\|warn\|info\)" packages/*/src apps/*/src \
  --include="*.ts" --include="*.tsx" \
  | grep -v "test\|spec\|stories"
```

### Bulk Migration Pattern

```bash
# 1. Import the logger
# Add to top of file:
import { logger } from '@acme/shared-utils'

# 2. Replace console statements:
# console.log → logger.info
# console.error → logger.error
# console.warn → logger.warn
# console.debug → logger.debug

# 3. Add context objects:
# console.log('Message', var) → logger.info('Message', { var })
```

### Example Migration

**Before:**
```typescript
export function processOrder(order: Order) {
  console.log('Processing order', order.id)

  try {
    const result = validate(order)
    console.log('Validation passed')
    return result
  } catch (error) {
    console.error('Validation failed', error)
    throw error
  }
}
```

**After:**
```typescript
import { logger } from '@acme/shared-utils'

export function processOrder(order: Order) {
  logger.info('Processing order', { orderId: order.id })

  try {
    const result = validate(order)
    logger.debug('Order validation passed', { orderId: order.id })
    return result
  } catch (error) {
    logger.error('Order validation failed', {
      orderId: order.id,
      error: error.message,
      stack: error.stack,
    })
    throw error
  }
}
```

---

## Integration with External Services

### Datadog

```typescript
// Configure Pino to send logs to Datadog
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // Datadog format
  formatters: {
    level: (label) => ({ level: label }),
  },
  // Send to Datadog HTTP endpoint
  transport: {
    target: 'pino-datadog',
    options: {
      apiKey: process.env.DATADOG_API_KEY,
      service: 'base-shop',
      hostname: process.env.HOSTNAME,
    },
  },
})
```

### Sentry

Errors can be automatically sent to Sentry:

```typescript
import * as Sentry from '@sentry/nextjs'
import { logger } from '@acme/shared-utils'

// Wrap logger.error to also send to Sentry
export function logAndCapture(message: string, meta: object = {}) {
  logger.error(message, meta)

  if (meta.error instanceof Error) {
    Sentry.captureException(meta.error, {
      extra: meta,
    })
  }
}
```

---

## Testing

### Mocking the Logger

```typescript
// __tests__/utils.test.ts
import { logger } from '@acme/shared-utils'

// Mock logger in tests
jest.mock('@acme/shared-utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

it('logs order creation', async () => {
  await createOrder(orderData)

  expect(logger.info).toHaveBeenCalledWith(
    'Order created',
    expect.objectContaining({ orderId: expect.any(String) })
  )
})
```

---

## Troubleshooting

### Logs Not Appearing

**Problem:** Logger output is not visible

**Solutions:**
1. Check `LOG_LEVEL` environment variable
   ```bash
   LOG_LEVEL=debug pnpm dev
   ```

2. Verify logger is imported correctly
   ```typescript
   import { logger } from '@acme/shared-utils' // ✅
   import logger from '@acme/shared-utils'     // ❌
   ```

3. Check if running in test mode (logs may be suppressed)

### Too Many Logs

**Problem:** Logs are overwhelming in development

**Solutions:**
1. Increase log level
   ```bash
   LOG_LEVEL=warn pnpm dev
   ```

2. Use `logger.debug()` for verbose logs (auto-hidden in production)

3. Filter logs in terminal:
   ```bash
   pnpm dev 2>&1 | grep ERROR
   ```

---

## References

- [Pino Documentation](https://getpino.io/)
- [Logger Implementation](../packages/shared-utils/src/logger.ts)
- [Request Context](../packages/shared-utils/src/requestContext.ts)
- [ESLint Configuration](../eslint.config.mjs)

---

**Last Updated:** 2026-01-12

For questions about logging, check this guide or review the `@acme/shared-utils` package source code.
