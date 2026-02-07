---
name: create-prisma-model
description: Add Prisma models with relations, indexes, validation, and repository pattern. Schema at packages/platform-core/prisma/schema.prisma.
---

# Create Prisma Model

Add a new model to `packages/platform-core/prisma/schema.prisma`.

## Workflow

### 1. Read existing schema for patterns
```bash
# Check naming, field types, index patterns, relations
```

### 2. Define Model

```prisma
model ModelName {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Fields
  name      String
  email     String   @unique
  status    Status   @default(PENDING)

  // Relations
  shop      Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)
  shopId    String

  // Indexes
  @@index([shopId])
  @@index([status, createdAt])
  @@map("model_names")
}

enum Status {
  PENDING
  ACTIVE
  COMPLETED
}
```

### 3. Key Patterns

**Relations:**
- One-to-many: parent has `children Child[]`, child has `parentId` + `@@index([parentId])`
- Many-to-many: explicit join table with `@@id([aId, bId])` + indexes on both FKs
- One-to-one: child has `parentId String @unique`

**OnDelete:** `Cascade` (delete children), `Restrict` (prevent parent delete), `SetNull`, `NoAction`

**Common fields:** `@db.Text` for long strings, `Decimal @db.Decimal(10, 2)` for currency, `Json?` for metadata

### 4. Create Repository

`packages/platform-core/src/repositories/modelName.server.ts`

```typescript
import { prisma } from '../lib/prisma'
import type { ModelName, Prisma } from '@prisma/client'

export const modelNameRepository = {
  async findById(id: string) { return prisma.modelName.findUnique({ where: { id } }) },
  async findMany(filters: Prisma.ModelNameWhereInput = {}) { return prisma.modelName.findMany({ where: filters, orderBy: { createdAt: 'desc' } }) },
  async create(data: Prisma.ModelNameCreateInput) { return prisma.modelName.create({ data }) },
  async update(id: string, data: Prisma.ModelNameUpdateInput) { return prisma.modelName.update({ where: { id }, data }) },
  async delete(id: string) { return prisma.modelName.delete({ where: { id } }) },
}
```

### 5. Export from package

Add to `packages/platform-core/src/index.ts`.

### 6. Generate

```bash
pnpm --filter @acme/platform-core exec prisma format
pnpm --filter @acme/platform-core exec prisma migrate dev --name add_model_name
pnpm prisma:generate
```

## Checklist

- [ ] Follows naming conventions (PascalCase model, snake_case table)
- [ ] All FK relations have `@@index`
- [ ] OnDelete behavior appropriate
- [ ] Unique constraints where needed
- [ ] Default values set
- [ ] Repository created and exported
- [ ] Migration generated
