# Create Prisma Model

## Context
Add a new model to the Prisma schema with proper relations, indexes, and validation.

## Prerequisites
- Model name: `{{ModelName}}`
- Database: PostgreSQL
- Schema location: `packages/platform-core/prisma/schema.prisma`

## Workflow

### 1. Read Existing Schema
```bash
# Read the current schema to understand patterns
```
Use Read tool on `packages/platform-core/prisma/schema.prisma`

Look for:
- Naming conventions
- Field types used
- Index patterns
- Relation patterns
- Validation attributes

### 2. Plan the Model

Define:
- [ ] Model name (PascalCase, singular)
- [ ] Fields and types
- [ ] Required vs optional fields
- [ ] Relations to other models
- [ ] Indexes needed
- [ ] Unique constraints

### 3. Add Model to Schema

**Basic structure:**
```prisma
model {{ModelName}} {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Your fields here

  @@map("{{table_name}}")
}
```

**Common field types:**
```prisma
model Example {
  // IDs
  id        String @id @default(cuid())  // CUID (recommended)
  uuid      String @id @default(uuid())  // UUID
  autoId    Int    @id @default(autoincrement())  // Auto-increment

  // Strings
  name      String
  email     String @unique
  bio       String @db.Text  // For long text

  // Numbers
  age       Int
  price     Decimal @db.Decimal(10, 2)  // For currency
  count     Int @default(0)

  // Booleans
  isActive  Boolean @default(true)
  verified  Boolean @default(false)

  // Dates
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  expiresAt DateTime?  // Optional

  // JSON
  metadata  Json?
  settings  Json @default("{}")

  // Enums
  status    Status @default(PENDING)
}

enum Status {
  PENDING
  ACTIVE
  COMPLETED
  CANCELLED
}
```

### 4. Add Relations

**One-to-many (most common):**
```prisma
model Shop {
  id    String @id @default(cuid())
  name  String

  // One shop has many pages
  pages Page[]
}

model Page {
  id     String @id @default(cuid())
  title  String

  // Many pages belong to one shop
  shop   Shop   @relation(fields: [shopId], references: [id], onDelete: Cascade)
  shopId String

  @@index([shopId])
}
```

**Many-to-many:**
```prisma
model Product {
  id         String @id @default(cuid())
  name       String

  categories ProductCategory[]
}

model Category {
  id       String @id @default(cuid())
  name     String

  products ProductCategory[]
}

model ProductCategory {
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId  String

  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  categoryId String

  @@id([productId, categoryId])
  @@index([productId])
  @@index([categoryId])
}
```

**One-to-one:**
```prisma
model User {
  id      String   @id @default(cuid())
  email   String   @unique

  profile Profile?
}

model Profile {
  id     String @id @default(cuid())
  bio    String

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String @unique
}
```

### 5. Add Indexes and Constraints

**Single field index:**
```prisma
model Order {
  id         String   @id
  customerId String
  status     String
  createdAt  DateTime @default(now())

  @@index([customerId])
  @@index([status])
  @@index([createdAt])
}
```

**Composite index:**
```prisma
model RentalOrder {
  id        String @id
  shop      String
  sessionId String

  // Unique together
  @@unique([shop, sessionId])

  // Compound index for queries
  @@index([shop, status, createdAt])
}
```

**Partial index (PostgreSQL):**
```prisma
model Booking {
  id        String   @id
  status    String
  deletedAt DateTime?

  // Index only active bookings
  @@index([status], where: { deletedAt: null })
}
```

### 6. Add OnDelete Behavior

Choose appropriate cascade behavior:
```prisma
model Shop {
  id    String @id
  pages Page[]
}

model Page {
  shopId String

  // Cascade - delete pages when shop deleted
  shop Shop @relation(fields: [shopId], references: [id], onDelete: Cascade)

  // Restrict - prevent shop deletion if has pages
  // shop Shop @relation(fields: [shopId], references: [id], onDelete: Restrict)

  // SetNull - set shopId to null when shop deleted
  // shop Shop @relation(fields: [shopId], references: [id], onDelete: SetNull)

  // NoAction - do nothing (may cause FK violation)
  // shop Shop @relation(fields: [shopId], references: [id], onDelete: NoAction)
}
```

### 7. Add Validation and Defaults

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  age       Int      @default(0)
  role      Role     @default(USER)
  isActive  Boolean  @default(true)
  metadata  Json     @default("{}")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@index([role, isActive])
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

### 8. Generate Migration

```bash
# Format the schema
pnpm --filter @acme/platform-core exec prisma format

# Generate migration
pnpm --filter @acme/platform-core exec prisma migrate dev --name add_{{model_name}}_model

# Generate Prisma Client
pnpm prisma:generate
```

### 9. Create Repository

**Create repository file:**
`packages/platform-core/src/repositories/{{modelName}}.server.ts`

```typescript
import { prisma } from '../lib/prisma'
import type { {{ModelName}}, Prisma } from '@prisma/client'

export const {{modelName}}Repository = {
  /**
   * Find by ID
   */
  async findById(id: string): Promise<{{ModelName}} | null> {
    return prisma.{{modelName}}.findUnique({
      where: { id },
    })
  },

  /**
   * Find many with filters
   */
  async findMany(
    filters: Prisma.{{ModelName}}WhereInput = {}
  ): Promise<{{ModelName}}[]> {
    return prisma.{{modelName}}.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
    })
  },

  /**
   * Create new record
   */
  async create(
    data: Prisma.{{ModelName}}CreateInput
  ): Promise<{{ModelName}}> {
    return prisma.{{modelName}}.create({
      data,
    })
  },

  /**
   * Update record
   */
  async update(
    id: string,
    data: Prisma.{{ModelName}}UpdateInput
  ): Promise<{{ModelName}}> {
    return prisma.{{modelName}}.update({
      where: { id },
      data,
    })
  },

  /**
   * Delete record
   */
  async delete(id: string): Promise<{{ModelName}}> {
    return prisma.{{modelName}}.delete({
      where: { id },
    })
  },

  /**
   * Count records
   */
  async count(filters: Prisma.{{ModelName}}WhereInput = {}): Promise<number> {
    return prisma.{{modelName}}.count({
      where: filters,
    })
  },
}
```

### 10. Add Type Exports

**Export types from platform-core:**
`packages/platform-core/src/index.ts`

```typescript
// Export Prisma types
export type {
  {{ModelName}},
  {{ModelName}}CreateInput,
  {{ModelName}}UpdateInput,
} from '@prisma/client'

// Export repository
export { {{modelName}}Repository } from './repositories/{{modelName}}.server'
```

## Quality Checks

```bash
# Validate schema syntax
pnpm --filter @acme/platform-core exec prisma validate

# Format schema
pnpm --filter @acme/platform-core exec prisma format

# Generate client to check types
pnpm prisma:generate

# Run migrations
pnpm --filter @acme/platform-core exec prisma migrate dev

# Type check
pnpm typecheck
```

**Checklist:**
- [ ] Model follows naming conventions
- [ ] All relations have proper indexes
- [ ] OnDelete behavior is appropriate
- [ ] Required fields are marked correctly
- [ ] Unique constraints where needed
- [ ] Composite indexes for common queries
- [ ] Default values set appropriately
- [ ] Repository methods created
- [ ] Types exported from package
- [ ] Migration generated and applied

## Common Patterns

### Soft Delete
```prisma
model Item {
  id        String    @id @default(cuid())
  name      String
  deletedAt DateTime?

  @@index([deletedAt])  // For filtering active items
}
```

### Timestamps
```prisma
model Record {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Shop-Scoped Data
```prisma
model ShopData {
  id     String @id @default(cuid())
  shop   String
  data   String

  @@unique([shop, id])
  @@index([shop])
}
```

### Status Tracking
```prisma
enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}

model Order {
  id        String      @id
  status    OrderStatus @default(PENDING)
  statusAt  DateTime    @default(now())

  @@index([status, statusAt])
}
```

## Common Mistakes

❌ **Missing indexes on foreign keys:**
```prisma
model Page {
  shopId String
  shop   Shop @relation(fields: [shopId], references: [id])

  // ❌ Missing index on shopId
}
```

✅ **Add index:**
```prisma
model Page {
  shopId String
  shop   Shop @relation(fields: [shopId], references: [id])

  @@index([shopId])  // ✅
}
```

❌ **Wrong cascade behavior:**
```prisma
// ❌ Pages will be deleted when shop deleted (probably not wanted)
shop Shop @relation(onDelete: Cascade)
```

❌ **Forgetting unique constraints:**
```prisma
// ❌ Allows duplicate emails
email String
```

✅ **Add unique:**
```prisma
email String @unique  // ✅
```

## Related
- [Prisma schema](../../../packages/platform-core/prisma/schema.prisma)
- [Database docs](../../docs/architecture.md#database)
- [Prisma documentation](https://www.prisma.io/docs)
