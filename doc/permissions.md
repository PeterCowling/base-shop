# Permission Guide

This guide lists built-in permissions and their default role mappings.

## read
Allows viewing CMS content and APIs.

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
Allows creating or modifying resources in the CMS.

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

## Granular permissions

In addition to the broad `read`/`write` flags, roles can have more specific permissions:

- `view_orders` – view order history. Roles: `customer`, `admin`, `ShopAdmin`
- `manage_orders` – create or modify orders. Roles: `admin`, `ShopAdmin`
- `manage_sessions` – manage active user sessions. Roles: `admin`, `ShopAdmin`
- `change_password` – change the user's password. Roles: `customer`, `admin`, `ShopAdmin`, `CatalogManager`, `ThemeEditor`

Use `hasPermission(role, permission)` from `@acme/auth` to check them.

## Extending roles

Roles and their permissions can be extended at runtime using `extendRoles` from `@acme/auth`.

```ts
import { extendRoles } from "@acme/auth";

extendRoles({ write: ["author"], read: ["reader"] });
```
