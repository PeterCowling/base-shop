# Telemetry Usage Guide

Quick reference for using the internal telemetry system in your applications.

## Overview

The `@acme/telemetry` package provides two main functions:
- `track()` - Track custom events (analytics, user actions, performance)
- `captureError()` - Capture and report errors with context

## Installation

The package is already available in all workspace apps. No installation needed.

## Importing

```typescript
import { track, captureError } from '@acme/telemetry';
```

## Tracking Events

### Basic Event

```typescript
track('user_clicked_button', {
  buttonId: 'checkout',
  page: '/cart'
});
```

### Performance Tracking

```typescript
const start = Date.now();
await fetchData();
const duration = Date.now() - start;

track('api_request_complete', {
  endpoint: '/api/products',
  duration,
  status: 200
});
```

### User Actions

```typescript
track('product_added_to_cart', {
  productId: product.id,
  quantity: 1,
  price: product.price
});

track('search_performed', {
  query: searchTerm,
  resultsCount: results.length
});

track('filter_applied', {
  filterType: 'category',
  filterValue: 'dresses'
});
```

### Build Flow Tracking

For deployment pipelines and build processes:

```typescript
track('build_flow_started', {
  commitSha: process.env.COMMIT_SHA,
  branch: process.env.BRANCH
});

track('build_flow_timer_deploy', {
  duration: deployTime,
  environment: 'production'
});
```

## Capturing Errors

### Basic Error Capture

```typescript
try {
  await riskyOperation();
} catch (err) {
  await captureError(err, {
    app: 'brikette',
    level: 'error'
  });
  // Handle error...
}
```

### Error with Context

```typescript
try {
  const response = await fetch('/api/checkout');
  if (!response.ok) throw new Error('Checkout failed');
} catch (err) {
  await captureError(err, {
    app: 'brikette',
    level: 'error',
    url: window.location.href,
    requestId: response.headers.get('x-request-id'),
    shopId: currentShop.id
  });
}
```

### Error Levels

```typescript
// Info - informational errors (degraded functionality but not breaking)
await captureError(err, { level: 'info' });

// Warning - potential issues (fallback used, retry needed)
await captureError(err, { level: 'warning' });

// Error - standard errors (user-facing issues)
await captureError(err, { level: 'error' });

// Fatal - critical errors (app crash, data corruption)
await captureError(err, { level: 'fatal' });
```

## Server-Side Usage

### In API Routes (Next.js App Router)

```typescript
// app/api/products/route.ts
import { captureError } from '@acme/telemetry';

export async function GET(request: Request) {
  try {
    const products = await db.product.findMany();
    return Response.json(products);
  } catch (err) {
    await captureError(err, {
      app: 'brikette',
      level: 'error',
      url: request.url,
      requestId: request.headers.get('x-request-id')
    });
    return Response.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
```

### In Server Components

```typescript
// app/products/page.tsx
import { captureError } from '@acme/telemetry';

export default async function ProductsPage() {
  try {
    const products = await getProducts();
    return <ProductList products={products} />;
  } catch (err) {
    await captureError(err, {
      app: 'brikette',
      level: 'error'
    });
    return <ErrorMessage />;
  }
}
```

### In Server Actions

```typescript
'use server'

import { captureError } from '@acme/telemetry';

export async function createOrder(formData: FormData) {
  try {
    const order = await db.order.create({ data: {...} });
    return { success: true, order };
  } catch (err) {
    await captureError(err, {
      app: 'brikette',
      level: 'error',
      shopId: formData.get('shopId')
    });
    return { success: false, error: 'Failed to create order' };
  }
}
```

## Client-Side Usage

### In Event Handlers

```typescript
'use client'

import { track, captureError } from '@acme/telemetry';

export function AddToCartButton({ product }) {
  const handleClick = async () => {
    try {
      await addToCart(product);
      track('product_added_to_cart', {
        productId: product.id,
        price: product.price
      });
    } catch (err) {
      await captureError(err, {
        app: 'brikette',
        level: 'error',
        url: window.location.href
      });
    }
  };

  return <button onClick={handleClick}>Add to Cart</button>;
}
```

### In useEffect

```typescript
'use client'

import { useEffect } from 'react';
import { track, captureError } from '@acme/telemetry';

export function ProductView({ productId }) {
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const product = await fetchProduct(productId);
        track('product_viewed', { productId });
      } catch (err) {
        await captureError(err, {
          app: 'brikette',
          level: 'error'
        });
      }
    };

    loadProduct();
  }, [productId]);

  return <div>...</div>;
}
```

### Error Boundaries (Automatic)

Error boundaries are already set up in all shop apps. They automatically capture React errors:

```typescript
// apps/brikette/src/root/Root.tsx
import { ErrorBoundary } from '@acme/ui';

export function Root() {
  return (
    <ErrorBoundary app="brikette">
      <App />
    </ErrorBoundary>
  );
}
```

## Instrumentation (Automatic)

All shop apps have instrumentation for uncaught errors:

```typescript
// apps/brikette/instrumentation.ts
import { captureError } from '@acme/telemetry';

export async function register() {
  process.on('uncaughtException', (err) => {
    captureError(err, {
      app: 'brikette',
      level: 'fatal'
    });
  });

  process.on('unhandledRejection', (reason) => {
    captureError(reason, {
      app: 'brikette',
      level: 'error'
    });
  });
}
```

## Context Fields

Available context fields for `captureError()`:

```typescript
interface ErrorContext {
  app?: string;              // App name (e.g., 'brikette', 'skylar')
  env?: string;              // Environment (e.g., 'production', 'development')
  level?: 'info' | 'warning' | 'error' | 'fatal';
  requestId?: string;        // Request ID for tracing
  shopId?: string;           // Shop identifier
  url?: string;              // Current URL
  componentStack?: string;   // React component stack (auto-added by ErrorBoundary)
  userId?: string;           // Authenticated user ID
  sessionId?: string;        // Session identifier
}
```

**Security Note:** Only allowlisted fields are captured. Never include sensitive data like passwords, tokens, or credit card numbers.

## Best Practices

### 1. Use Appropriate Error Levels

```typescript
// ✅ Good
await captureError(err, { level: 'warning' }); // Non-critical issue
await captureError(err, { level: 'fatal' });   // App crash

// ❌ Bad
await captureError(err, { level: 'fatal' });   // Minor validation error
```

### 2. Include Context

```typescript
// ✅ Good - includes helpful context
await captureError(err, {
  app: 'brikette',
  level: 'error',
  requestId: req.id,
  shopId: shop.id,
  url: req.url
});

// ❌ Bad - no context
await captureError(err);
```

### 3. Don't Capture Expected Errors

```typescript
// ✅ Good - handle validation errors without capturing
if (!email.includes('@')) {
  return { error: 'Invalid email' };
}

// ❌ Bad - captures expected validation errors
try {
  validateEmail(email);
} catch (err) {
  await captureError(err); // Don't do this for validation
}
```

### 4. Track User Journeys

```typescript
// Track key user actions to understand flows
track('checkout_started', { cartValue: total });
track('payment_method_selected', { method: 'card' });
track('order_completed', { orderId: order.id, total });
```

### 5. Use Descriptive Event Names

```typescript
// ✅ Good - clear, specific names
track('product_added_to_cart', { productId });
track('search_performed', { query });
track('filter_applied', { filterType, filterValue });

// ❌ Bad - vague names
track('click', { id });
track('action', { type: 'add' });
```

### 6. Avoid High-Frequency Events in Production

```typescript
// ❌ Bad - tracks on every scroll (too frequent)
window.addEventListener('scroll', () => {
  track('page_scrolled', { scrollY: window.scrollY });
});

// ✅ Good - tracks meaningful milestones
function trackScrollDepth(depth: number) {
  if ([25, 50, 75, 100].includes(depth)) {
    track('scroll_depth', { depth });
  }
}
```

## Viewing Telemetry Data

### CMS Dashboard

Navigate to `/cms/telemetry` in the CMS to view:
- All events and errors
- Filters by name, kind, level, app, time range
- Error-specific presets
- Summary tables with event counts
- Time-series charts

### Useful Presets

- **All errors** - View all error events across all apps
- **Fatal errors** - Critical errors requiring immediate attention
- **Recent errors** - Errors from the last 24 hours
- **Build flow** - Deployment and build events
- **Checkout** - Checkout-related events

### Filtering Examples

**Find all checkout errors:**
- Kind: Error
- Name: checkout

**Find fatal errors in Brikette:**
- Kind: Error
- Level: Fatal
- App: brikette

**Find API errors in last hour:**
- Kind: Error
- Name: api
- Start: [1 hour ago]
- End: [now]

## Performance Considerations

### Sampling

High-traffic apps should use sampling:

```bash
# .env.production
NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE=0.1  # 10% of events
```

Errors are always captured regardless of sample rate.

### Batch Size

The SDK automatically batches events. Default batch size is 10 events or 5 seconds, whichever comes first.

### Async Capture

Both `track()` and `captureError()` are fire-and-forget. They don't block your application:

```typescript
// This doesn't block rendering
await captureError(err); // Actually resolves immediately

// Equivalent to:
captureError(err); // Can omit await
```

## Troubleshooting

### Events Not Appearing

Check:
1. `NEXT_PUBLIC_ENABLE_TELEMETRY=true` in `.env.local`
2. `NEXT_PUBLIC_TELEMETRY_ENDPOINT` is set correctly
3. Browser console for network errors
4. Worker logs: `wrangler tail telemetry-worker`

### TypeScript Errors

Ensure `@acme/telemetry` is in your `tsconfig.json` paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@acme/telemetry": [
        "../../packages/telemetry/dist/index.d.ts",
        "../../packages/telemetry/src/index.ts"
      ]
    }
  }
}
```

### CORS Errors

Verify your domain is in `ALLOWED_ORIGINS` in `apps/telemetry-worker/wrangler.toml`.

## Examples by Use Case

### E-commerce Checkout Flow

```typescript
// 1. Checkout started
track('checkout_started', {
  cartValue: cart.total,
  itemCount: cart.items.length
});

// 2. Shipping address entered
track('shipping_address_entered', {
  country: address.country,
  shippingMethod: selectedMethod
});

// 3. Payment method selected
track('payment_method_selected', {
  method: paymentMethod // 'card', 'paypal', etc.
});

// 4. Order completed
track('order_completed', {
  orderId: order.id,
  total: order.total,
  duration: checkoutDuration
});

// Error during checkout
try {
  await processPayment();
} catch (err) {
  await captureError(err, {
    app: 'brikette',
    level: 'error',
    shopId: shop.id,
    requestId: req.id
  });
  track('checkout_failed', {
    step: 'payment',
    error: err.message
  });
}
```

### Product Search and Discovery

```typescript
// Search performed
track('search_performed', {
  query: searchTerm,
  resultsCount: results.length,
  duration: searchDuration
});

// Filter applied
track('filter_applied', {
  filterType: 'category',
  filterValue: 'dresses',
  resultsCount: filteredResults.length
});

// Product viewed
track('product_viewed', {
  productId: product.id,
  source: 'search_results',
  position: 3
});

// Product added to cart
track('product_added_to_cart', {
  productId: product.id,
  price: product.price,
  quantity: 1
});
```

### User Authentication

```typescript
// Login attempt
try {
  await signIn(credentials);
  track('login_success', {
    provider: 'credentials',
    userId: user.id
  });
} catch (err) {
  await captureError(err, {
    app: 'brikette',
    level: 'warning'
  });
  track('login_failed', {
    provider: 'credentials',
    reason: err.message
  });
}

// Registration
try {
  await registerUser(data);
  track('registration_success', {
    provider: 'email',
    userId: newUser.id
  });
} catch (err) {
  await captureError(err, {
    app: 'brikette',
    level: 'error'
  });
}
```

## Summary

- Use `track()` for events, user actions, and analytics
- Use `captureError()` for errors with appropriate level
- Include context for better debugging
- View data in CMS at `/cms/telemetry`
- ErrorBoundary and instrumentation capture errors automatically

For deployment and configuration, see [telemetry-deployment.md](./telemetry-deployment.md).
