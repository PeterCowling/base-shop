# API Request & Response Validation

This document describes the comprehensive validation infrastructure for CMS API endpoints, including request body validation, query parameter validation, and response validation.

## Overview

All API endpoints in the CMS app use Zod schemas to validate:
1. **Query Parameters** - URL search params and route params
2. **Request Bodies** - JSON and FormData payloads
3. **Responses** - Outgoing data before sending to clients

This provides end-to-end type safety, prevents security vulnerabilities, and catches serialization bugs.

## Table of Contents

- [Query Parameter Validation](#query-parameter-validation)
- [Request Body Validation](#request-body-validation)
- [Response Validation](#response-validation)
- [Common Schemas](#common-schemas)
- [TypeScript Types](#typescript-types)
- [Client Usage](#client-usage)
- [Best Practices](#best-practices)
- [Migrated Endpoints](#migrated-endpoints)

## Query Parameter Validation

### Usage

```typescript
import { validateQuery, QuerySchemas } from "@/lib/server/queryValidation";
import { z } from "zod";

const myQuerySchema = z.object({
  shop: QuerySchemas.shop,
  page: QuerySchemas.page.optional(),
  limit: QuerySchemas.limit.optional(),
});

export async function GET(req: NextRequest) {
  const result = validateQuery(req, myQuerySchema);
  if (result.error) return result.error;

  const { shop, page, limit } = result.data;
  // Use validated data...
}
```

### Available Query Schemas

```typescript
QuerySchemas = {
  shop: z.string().min(1).max(100),
  page: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().positive().max(250).default(50),
  id: z.string().min(1),
  stringArray: z.array(z.string()),
  offset: z.number().int().nonnegative().optional(),
}
```

## Request Body Validation

### Usage

```typescript
import { validateBody } from "@/lib/server/queryValidation";
import { z } from "zod";

const myBodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(["draft", "published"]),
});

export async function POST(req: NextRequest) {
  const result = await validateBody(req, myBodySchema);
  if (result.error) return result.error;

  const { title, description, status } = result.data;
  // Use validated data...
}
```

### Features

- **Automatic Size Limit**: 1MB default (configurable)
- **DoS Protection**: Rejects oversized payloads with 413 status
- **Type Inference**: Full TypeScript types from schema
- **Detailed Errors**: Structured validation errors with field-level details

### Mixed Content Types

For endpoints that accept both JSON and FormData:

```typescript
export async function POST(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";
  let bodyData: z.infer<typeof myBodySchema> = {};

  if (ct.includes("application/json")) {
    const result = await validateBody(req, myBodySchema);
    if (result.error) return result.error;
    bodyData = result.data;
  } else if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    // Parse FormData fields
    bodyData.title = fd.get("title") as string;
    // Validate parsed data
    const validated = myBodySchema.safeParse(bodyData);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: validated.error.format() },
        { status: 400 }
      );
    }
    bodyData = validated.data;
  }

  // Use validated bodyData...
}
```

## Response Validation

### Usage

```typescript
import { validateResponse, ResponseSchemas } from "@/lib/server/queryValidation";
import { z } from "zod";

const myResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string().datetime(),
});

export async function GET(req: NextRequest) {
  const data = await fetchData();
  return validateResponse(data, myResponseSchema);
}
```

### Features

- **Development Mode**: Logs validation errors with full details
- **Production Mode**: Returns 500 error instead of sending invalid data
- **Type Safety**: Prevents sending non-serializable or malformed data
- **Custom Status Codes**: Configure status and headers

```typescript
// Success response
return validateResponse({ ok: true }, ResponseSchemas.ok);

// Error response with custom status
return validateResponse(
  { error: "Not found" },
  ResponseSchemas.error,
  { status: 404 }
);

// Custom headers
return validateResponse(
  data,
  mySchema,
  {
    status: 201,
    headers: { "X-Custom-Header": "value" }
  }
);
```

## Common Schemas

### Response Schemas

```typescript
ResponseSchemas = {
  // Standard success response
  success: z.object({
    success: z.literal(true),
  }),

  // Success with message
  successWithMessage: z.object({
    success: z.literal(true),
    message: z.string().optional(),
  }),

  // Simple OK response
  ok: z.object({
    ok: z.literal(true),
  }),

  // Error response
  error: z.object({
    error: z.string(),
    details: z.unknown().optional(),
  }),

  // Paginated response wrapper
  paginated: <T>(itemSchema: T) => z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  }),

  // ISO timestamp
  timestamp: z.string().datetime(),

  // ID string
  id: z.string().min(1),
}
```

### Usage Examples

```typescript
// Simple success
return validateResponse({ success: true }, ResponseSchemas.success);

// Paginated data
const paginatedSchema = ResponseSchemas.paginated(productSchema);
return validateResponse(
  { items: products, total: 100, page: 1, pageSize: 10 },
  paginatedSchema
);

// Error with details
return validateResponse(
  { error: "Validation failed", details: errors },
  ResponseSchemas.error,
  { status: 400 }
);
```

## TypeScript Types

### Generated Types

All response schemas have corresponding TypeScript types in `@/lib/server/apiTypes.ts`:

```typescript
import type {
  CampaignResponse,
  LibraryListResponse,
  ProductResponse,
  ErrorResponse,
} from "@/lib/server/apiTypes";

// Use in client code
const response = await fetch("/api/campaigns", { method: "POST", body });
const data: CampaignResponse = await response.json();
```

### Type Guards

```typescript
import { isErrorResponse, isSuccessResponse } from "@/lib/server/apiTypes";

const data = await response.json();

if (isErrorResponse(data)) {
  console.error("Error:", data.error);
} else if (isSuccessResponse(data)) {
  console.log("Success!");
}
```

### API Client Helper

```typescript
import { createApiClient } from "@/lib/server/apiTypes";

const sendCampaign = createApiClient<CampaignBody, CampaignResponse>({
  url: "/api/campaigns",
  method: "POST",
});

const result = await sendCampaign({ to, subject, body });
if (result.success) {
  console.log("Sent successfully");
} else {
  console.error("Error:", result.error.error);
}
```

## Client Usage

### React Component Example

```typescript
"use client";

import { useState } from "react";
import type { LibraryListResponse, LibraryError } from "@/lib/server/apiTypes";

export function LibraryList({ shop }: { shop: string }) {
  const [items, setItems] = useState<LibraryListResponse>([]);
  const [error, setError] = useState<LibraryError | null>(null);

  async function fetchItems() {
    const response = await fetch(`/api/library?shop=${shop}`);
    const data = await response.json();

    if (!response.ok) {
      setError(data as LibraryError);
    } else {
      setItems(data as LibraryListResponse);
    }
  }

  // ... render UI
}
```

### Custom Hook Example

```typescript
import { useState, useEffect } from "react";
import type { ApiResult } from "@/lib/server/apiTypes";

function useApi<T>(
  fetcher: () => Promise<T>
): { data: T | null; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetcher()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

// Usage
const { data, loading, error } = useApi<LibraryListResponse>(
  () => fetch(`/api/library?shop=${shop}`).then(r => r.json())
);
```

## Best Practices

### 1. Always Validate Input

```typescript
// ❌ Bad - no validation
export async function POST(req: NextRequest) {
  const body = await req.json();
  await saveData(body.title); // Unsafe!
}

// ✅ Good - validated
export async function POST(req: NextRequest) {
  const result = await validateBody(req, bodySchema);
  if (result.error) return result.error;
  await saveData(result.data.title); // Type-safe!
}
```

### 2. Use Common Schemas

```typescript
// ❌ Bad - reinventing the wheel
const mySuccessSchema = z.object({ ok: z.boolean() });

// ✅ Good - reuse common schemas
return validateResponse({ ok: true }, ResponseSchemas.ok);
```

### 3. Validate Responses

```typescript
// ❌ Bad - no validation
export async function GET() {
  const data = await fetchData();
  return NextResponse.json(data); // Might fail in production!
}

// ✅ Good - validated
export async function GET() {
  const data = await fetchData();
  return validateResponse(data, myResponseSchema); // Catches bugs!
}
```

### 4. Use Type Inference

```typescript
// ❌ Bad - manual typing
const bodySchema = z.object({ title: z.string() });
const { title }: { title: string } = result.data;

// ✅ Good - inferred types
const bodySchema = z.object({ title: z.string() });
const { title } = result.data; // Type is automatically string
```

### 5. Handle Both Success and Error Cases

```typescript
// Client code
const response = await fetch("/api/data");
const data = await response.json();

if (!response.ok) {
  // Handle error case
  const error = data as ErrorResponse;
  console.error(error.error);
} else {
  // Handle success case
  const result = data as SuccessResponse;
  console.log(result);
}
```

## Migrated Endpoints

The following endpoints have been fully migrated to use request body and response validation:

### POST/PATCH/PUT Endpoints (Body Validation)

1. **`/api/campaigns`** - POST
   - Body: `{ to: email, subject: string, body: string }`
   - Response: `{ ok: true }`

2. **`/api/categories/[shop]`** - POST
   - Body: `Category[]` (recursive tree structure)
   - Response: `{ success: true }`

3. **`/api/checkout-page/[shop]`** - GET, POST
   - Body: `{ templateId?: string }`
   - Response: `CheckoutPageSummary`

4. **`/api/library`** - GET, POST, PATCH, DELETE
   - POST Body: `{ item?: object, items?: object[] }`
   - PATCH Body: `{ id: string, patch: object }`
   - Response: `LibraryItem[]` or `{ ok: true }`

5. **`/api/media`** - GET, POST, PATCH, DELETE
   - PATCH Body: `{ file: string, title?, altText?, tags? }`
   - Response: `MediaItem` or `{ success: true }`

6. **`/api/pages/[shop]`** - GET, POST
   - Body: `{ title?: string, slug?: string, locale?: string }`
   - Response: `Page[]` or `Page`

7. **`/api/products`** - GET
   - Response: `ProductSku[]` or `ProductSku`

### Benefits Achieved

- **Type Safety**: All inputs and outputs are type-checked
- **Security**: Prevents injection attacks, validates email addresses, enforces size limits
- **Consistency**: All endpoints follow the same validation pattern
- **Documentation**: Schemas serve as API documentation
- **Error Handling**: Structured validation errors with field-level details
- **Production Safety**: Invalid responses return 500 instead of sending malformed data

## Troubleshooting

### Response Validation Fails in Development

Check the console for detailed error messages:

```
Response validation failed: {
  _errors: [],
  fieldName: { _errors: ['Expected string, received number'] }
}
Data: { ... }
```

Fix the data or update the schema to match.

### Type Errors in Client Code

Ensure you're importing types from `@/lib/server/apiTypes`:

```typescript
import type { MyResponse } from "@/lib/server/apiTypes";
```

Not from the schema file directly.

### Mixed Content Type Issues

For endpoints accepting both JSON and FormData, ensure you:
1. Parse FormData fields correctly
2. Validate the parsed data with the same schema
3. Handle JSON parsing errors for complex fields

See [Mixed Content Types](#mixed-content-types) section for examples.

## Future Enhancements

Potential improvements:

1. **OpenAPI/Swagger Generation**: Auto-generate API docs from schemas
2. **Client SDK Generation**: Generate typed API clients automatically
3. **Runtime Schema Registry**: Dynamic schema loading and versioning
4. **Schema Evolution**: Track schema changes over time
5. **Performance Monitoring**: Track validation performance impact

---

**Last Updated**: 2026-01-12
**Maintained By**: Platform Team
**Related Docs**:
- [Testing Guide](__tests__/docs/testing.md)
- [API Architecture](docs/architecture.md)
- [Security Best Practices](docs/security.md)
