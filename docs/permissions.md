Type: Contract
Status: Canonical
Domain: Auth
Last-reviewed: 2025-12-29

Primary code entrypoints:
- apps/cms/src/app/cms/rbac/**
- apps/cms/src/actions/common/auth.ts
- apps/cms/src/app/api/shop/[shop]/product-import/route.ts
- apps/cms/src/app/api/shop/[shop]/stock-inflows/route.ts
- apps/cms/src/app/api/shop/[shop]/stock-adjustments/route.ts
- packages/auth/src/permissions.json
- packages/auth/src/permissions.ts
- packages/auth/src/requirePermission.ts
- packages/auth/src/rbac.ts

# Permission Guide

This guide lists built-in permissions and their default role mappings.

Note: the inventory matrix save endpoint now enforces `manage_inventory` (default roles: `admin`, `ShopAdmin`), matching stock inflows.

## Default permission map

Source of truth: `packages/auth/src/permissions.json`.

| Permission | Default roles |
| --- | --- |
| `view_products` | viewer, customer, admin, ShopAdmin, CatalogManager, ThemeEditor |
| `add_to_cart` | customer, admin, ShopAdmin, CatalogManager, ThemeEditor |
| `checkout` | customer, admin, ShopAdmin, CatalogManager, ThemeEditor |
| `view_profile` | customer, admin, ShopAdmin, CatalogManager, ThemeEditor |
| `manage_profile` | customer, admin, ShopAdmin, CatalogManager, ThemeEditor |
| `change_password` | customer, admin, ShopAdmin, CatalogManager, ThemeEditor |
| `manage_cart` | customer, admin, ShopAdmin, CatalogManager, ThemeEditor |
| `view_orders` | customer, admin, ShopAdmin |
| `manage_catalog` | admin, ShopAdmin, CatalogManager |
| `manage_inventory` | admin, ShopAdmin |
| `manage_media` | admin, ShopAdmin, CatalogManager |
| `manage_orders` | admin, ShopAdmin |
| `manage_pages` | admin, ShopAdmin |
| `manage_sessions` | admin, ShopAdmin |
| `process_returns` | admin, ShopAdmin |
| `manage_rentals` | admin, ShopAdmin |

## read
Allows viewing CMS content and APIs (coarse role gate).

**Default roles**

- `admin`
- `ShopAdmin`
- `CatalogManager`
- `ThemeEditor`
- `viewer`
- `customer`

**Example**

```ts
import { canRead } from "@acme/auth";

if (!canRead(session.user.role)) {
  throw new Error("Not authorized to view this resource");
}
```

## write
Allows creating or modifying resources in the CMS (coarse role gate).

**Default roles**

- `admin`
- `ShopAdmin`
- `CatalogManager`
- `ThemeEditor`

**Example**

```ts
import { canWrite } from "@acme/auth";

if (!canWrite(session.user.role)) {
  throw new Error("Not authorized to change this resource");
}
```

## Extending roles

Roles and their permissions can be extended at runtime using `extendRoles` from `@acme/auth`.

```ts
import { extendRoles } from "@acme/auth";

extendRoles({ write: ["author"], read: ["reader"] });
```

## Sample role scenarios

The storefront enforces permissions on both UI and API routes. The following
examples show how common roles interact with those checks.

### Viewer

- Can browse products using the `view_products` permission.
- Attempts to add items to the cart fail because `manage_cart` is missing.

```ts
import { requirePermission } from "@acme/auth";

export async function addItem() {
  await requirePermission("manage_cart"); // throws for viewers
}
```

### Customer

- Can add to cart and proceed to checkout.
- Can view and update their profile information.

```ts
await requirePermission("checkout"); // allowed
```

### Admin

- Has full access including order management and returns processing.

```ts
await requirePermission("manage_orders");
```

### CatalogManager (CMS uploads)

- Can manage catalogue imports and media uploads (for example `manage_catalog`, `manage_media`).
- Cannot receive stock inflows because `manage_inventory` is missing.

```ts
import { requirePermission } from "@acme/auth";

await requirePermission("manage_catalog"); // allowed
await requirePermission("manage_inventory"); // throws
```
