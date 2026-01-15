# API Validation Migration Checklist

Use this checklist when adding new API endpoints or migrating existing ones to use the validation infrastructure.

## For New Endpoints

- [ ] **Query Parameter Validation**
  - [ ] Import `validateQuery` and `QuerySchemas` from `@/lib/server/queryValidation`
  - [ ] Create a query schema using Zod
  - [ ] Use `QuerySchemas` for common fields (shop, page, limit, id)
  - [ ] Call `validateQuery(req, schema)` at the start of the handler
  - [ ] Return early if `result.error` is present

- [ ] **Request Body Validation** (for POST/PATCH/PUT)
  - [ ] Import `validateBody` from `@/lib/server/queryValidation`
  - [ ] Create a body schema using Zod
  - [ ] Add appropriate constraints (min/max length, email validation, etc.)
  - [ ] Call `await validateBody(req, schema)`
  - [ ] Return early if `result.error` is present
  - [ ] For mixed content types (JSON + FormData), handle both cases

- [ ] **Response Validation**
  - [ ] Import `validateResponse` and `ResponseSchemas` from `@/lib/server/queryValidation`
  - [ ] Create response schemas for success and error cases
  - [ ] Use `ResponseSchemas` for common patterns (ok, success, error)
  - [ ] Replace all `NextResponse.json()` calls with `validateResponse()`
  - [ ] Test in development mode to ensure validation passes

- [ ] **TypeScript Types**
  - [ ] Add type definitions to `@/lib/server/apiTypes.ts`
  - [ ] Export request body type
  - [ ] Export response type
  - [ ] Export error type
  - [ ] Add to union types (`ApiResponse`, `ApiError`)

- [ ] **Client Example**
  - [ ] Add client implementation to `@/lib/client/apiClient.example.ts`
  - [ ] Use `createApiClient` helper
  - [ ] Include usage example in comments

- [ ] **Documentation**
  - [ ] Add endpoint to "Migrated Endpoints" section in `docs/api-validation.md`
  - [ ] Document request body schema
  - [ ] Document response schema
  - [ ] Include example usage

- [ ] **Testing**
  - [ ] Test with valid request
  - [ ] Test with invalid request (should return 400)
  - [ ] Test with oversized body (should return 413)
  - [ ] Test response validation in development mode
  - [ ] Verify TypeScript types work in client code

## For Existing Endpoints

Follow the same checklist as above, plus:

- [ ] **Read the Endpoint First**
  - [ ] Use Read tool to examine the current implementation
  - [ ] Identify all validation logic (if any)
  - [ ] Note any custom error handling

- [ ] **Preserve Behavior**
  - [ ] Match existing validation rules in schema
  - [ ] Keep the same error messages
  - [ ] Maintain the same status codes
  - [ ] Don't change the response format

- [ ] **Remove Old Validation**
  - [ ] Remove manual `JSON.parse()` calls
  - [ ] Remove manual type assertions (`as Type`)
  - [ ] Remove manual field validation
  - [ ] Keep domain-specific validation (e.g., checking if record exists)

- [ ] **Verify No Regressions**
  - [ ] Run existing tests
  - [ ] Test with real client code if possible
  - [ ] Check for TypeScript errors

## Example Migration

### Before

```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, slug } = body;

    if (!title || title.length > 200) {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }

    const result = await createPage({ title, slug });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

### After

```typescript
import { validateBody, validateResponse, ResponseSchemas } from "@/lib/server/queryValidation";
import { z } from "zod";

const pageBodySchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().optional(),
});

const pageResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  createdAt: z.string(),
});

const pageErrorSchema = ResponseSchemas.error;

export async function POST(req: NextRequest) {
  const result = await validateBody(req, pageBodySchema);
  if (result.error) return result.error;

  const { title, slug } = result.data;

  try {
    const page = await createPage({ title, slug });
    return validateResponse(page, pageResponseSchema);
  } catch (err) {
    return validateResponse(
      { error: "Failed" },
      pageErrorSchema,
      { status: 500 }
    );
  }
}
```

## Common Patterns

### Recursive Schemas (Categories with Children)

```typescript
const categorySchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    children: z.array(categorySchema).optional(),
  })
);
```

### Union Types (Multiple Formats)

```typescript
const tagsSchema = z.union([
  z.array(z.string()),
  z.string(),
  z.null(),
]);
```

### Custom Refinements (Complex Validation)

```typescript
const bodySchema = z.object({
  item: z.record(z.unknown()).optional(),
  items: z.array(z.record(z.unknown())).optional(),
}).refine(
  (data) => data.item || data.items,
  { message: "Either item or items must be provided" }
);
```

### Optional Fields with Defaults

```typescript
const querySchema = z.object({
  shop: z.string().default("default"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
```

### Nullable Fields

```typescript
const bodySchema = z.object({
  title: z.string().nullable().optional(),
  description: z.string().optional(),
});
```

## Quality Checks

Before marking an endpoint as complete:

- [ ] No `NextResponse.json()` calls remain (all use `validateResponse`)
- [ ] No manual `await req.json()` calls remain (all use `validateBody`)
- [ ] No type assertions (`as Type`) in handler
- [ ] All possible response paths are validated
- [ ] TypeScript infers correct types from schemas
- [ ] Client types are exported in `apiTypes.ts`
- [ ] Documentation is updated
- [ ] Tests pass

## Red Flags

Watch out for these issues:

- ⚠️ **Using `any` type**: Schema should be fully typed
- ⚠️ **Skipping validation**: All code paths should validate
- ⚠️ **Inconsistent error formats**: Use `ResponseSchemas.error`
- ⚠️ **Missing type exports**: Client code needs types
- ⚠️ **No tests**: Validation should be tested

## Getting Help

- **Documentation**: See [API Validation Guide](./api-validation.md)
- **Examples**: Check [API Client Examples](../src/lib/client/apiClient.example.ts)
- **Types**: Reference [API Types](../src/lib/server/apiTypes.ts)
- **Schemas**: Review [Query Validation](../src/lib/server/queryValidation.ts)

---

**Quick Reference**:
- `validateQuery(req, schema)` - Validate URL params
- `validateBody(req, schema)` - Validate request body
- `validateResponse(data, schema, options?)` - Validate response
- `QuerySchemas.*` - Common query parameter schemas
- `ResponseSchemas.*` - Common response schemas
