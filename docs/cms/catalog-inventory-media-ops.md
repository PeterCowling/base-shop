Type: Guide
Status: Active
Domain: Commerce
Last-reviewed: 2026-01-16

Related docs:
- docs/commerce-charter.md
- docs/plans/catalog-stock-media-upload-facility-plan.md (architecture + remaining gaps)
- docs/permissions.md

If behaviour in this doc contradicts the code, treat the code as canonical and update this doc as a follow‑up.

# Catalog, Inventory, and Media — Upload → Storefront → Checkout (Agent Runbook)

Audience: agents executing CMS workflows for shop operators; assume CMS access.

This guide documents how to:

1) Add / update / remove products (catalogue)
2) Publish products (status change) and attach product images/media
3) Receive and correct inventory (stock)
4) Understand how each storefront reads and displays products
5) Verify + validate the end‑to‑end lifecycle

Shops covered:

- **Cochlear headband shop:** `cochlearfit`
- **Cover‑Me‑Pretty shop:** `cover-me-pretty`

---

## Quick reference (where to do things)

For a given shop id (`cochlearfit` or `cover-me-pretty`):

- **Products list (single product CRUD):** `/cms/shop/<shop>/products`
- **Uploads hub:** `/cms/shop/<shop>/uploads`
  - **Product import (bulk upsert + status changes):** `/cms/shop/<shop>/uploads/products`
  - **Stock inflows (receive stock, delta-based):** `/cms/shop/<shop>/uploads/stock-inflows`
  - **Stock adjustments (positive/negative with reason):** `/cms/shop/<shop>/uploads/stock-adjustments`
  - **Media library (upload/manage files):** `/cms/shop/<shop>/media`
  - **Variant pricing (cochlearfit only):** `/cms/shop/<shop>/pricing/variants` — manage checkout variant prices + Stripe price IDs (`variants.json`)
- **Inventory matrix (absolute edit + import/export):** `/cms/shop/<shop>/data/inventory`
- **Sellability at a glance:** the Products list shows a **Sellability** pill (active + in-stock + media present + translations + rebuild-needed for static shops).
- **Inventory history:** on `/data/inventory`, click **History** on a row to see the inflow/adjustment/reverse-logistics ledger for that SKU/variant.

Storefront verification:

- **Cover‑Me‑Pretty shop page:** `/<lang>/shop` (example: `/en/shop`)
- **Cover‑Me‑Pretty product page:** `/<lang>/product/<slug>` (example: `/en/product/green-sneaker`)
- **Cochlearfit shop page:** `/<lang>/shop` (example: `/en/shop`)
- **Cochlearfit product page:** `/<lang>/product/<slug>` (example: `/en/product/classic`)

---

## Concepts (what is being edited)

### 1) Product (catalogue record)
Defines what a customer can see:

- Title + description (per language)
- Price (minor units — cents)
- Status (draft/review/scheduled/active/archived)
- Media gallery (images/videos with ordering + alt text)

**Visibility rule:** storefronts only show products where `status = active` (drafts are hidden).

Publishing happens in **Product import**, not in the product editor:

- Editing a product in `/products` does **not** change its status.
- To publish/unpublish, use **Uploads → Product import** (section D).

### 2) Inventory (stock records)
Defines what can be purchased (and in what sizes/variants), and whether it’s in stock.

Inventory is tracked per **SKU**. An inventory row also has an optional `variantAttributes` object (for example `{ "size": "40" }`).

Important:

- Inventory rows are uniquely identified by **(sku + variantAttributes)**.
- If `variantAttributes` is sometimes included and sometimes omitted for the same SKU, duplicate rows can be created that look like “the same SKU”.
  - This matters most for **stock inflows**: if `variantAttributes` is omitted on a receipt line but existing inventory rows include it, the system treats it as a *different* row and adds stock to the wrong place.
  - The stock inflows page loads the current inventory and lets operators **select the existing row**, keeping the exact `variantAttributes` consistent.

### 3) Media (images/videos)
Uploaded files produce stable URLs that can be attached to products, for example:

- Local dev / filesystem-backed: `/uploads/<shop>/<filename>`
- R2-backed (if configured): `https://…/uploads/<shop>/<filename>` (an absolute public URL)

---

## Access / permissions (required capabilities)

You must be signed into the CMS.

- To use **Uploads → Product import**, the role must have permission `manage_catalog`.
- To use **Uploads → Stock inflows**, the role must have permission `manage_inventory`.
- To use the **Media library**, the role must have permission `manage_media`.
- To **save** the Inventory matrix (`/data/inventory`), the role must have `manage_inventory` (default roles: `admin`, `ShopAdmin`).

If blocked (403), the missing permission is usually one of: `manage_catalog`, `manage_inventory`, `manage_media`. Ask a shop admin to grant the appropriate role/permissions.

---

## A) Add a new product (single-product flow)

Use this when adding a small number of products manually.

1) Go to `/cms/shop/<shop>/products`.
2) Click **Add new**.
3) Fill the product editor:
   - **Pricing**: set `Price (cents)` (example: `11900` for €119.00).
   - **Media gallery**: upload images or paste/ingest URLs (see Media section below).
- **Localized content**: fill title + description for the shop’s supported CMS locales (EN/DE/IT/ES).
4) Click **Save changes**.

### Make it visible to customers (set `status = active`)
New products created in the CMS are created as drafts.

To publish it, use **Product import** (next section) to set `status` to `active` for that product.

---

## B) Update an existing product

1) Go to `/cms/shop/<shop>/products`.
2) Click **Edit** for the target product.
3) Make edits (pricing, localized text, media ordering, etc.).
4) Click **Save changes**.

Notes:

- This updates the catalogue record only. It does not change inventory quantities.
- Product “status” is not currently edited from the product editor; use Product import to change status.

---

## C) Remove (or delete) a product

There are three different “remove” operations; pick the right one:

### 1) Hide from customers (recommended)
Set product `status` to `archived` (or `draft`) via **Product import**. This keeps the record for reporting and later reactivation.

### 2) Remove stock only (keep product visible but out of stock)
Set inventory quantities to `0` (or delete the rows) in `/cms/shop/<shop>/data/inventory`.

### 3) Permanently delete the product record
From `/cms/shop/<shop>/products`, click **Delete**.

Important:

- Deleting a product does **not** automatically delete inventory rows for that product.
- After deleting a product, clean up inventory rows manually to avoid stale SKUs.
  - If the SKU might be re-used later, prefer archiving instead of deleting to retain history and avoid conflicts.

---

## D) Bulk upsert products (Product import: CSV/JSON)

Use this when the flow requires:

- Create many products quickly
- Update many products in one operation
- Change product `status` (publish/unpublish/archive)

Go to `/cms/shop/<shop>/uploads/products`.

### Two-step safety model (Preview → Commit)

- **Preview** runs validation and shows a report; it does not change data.
- **Import products** (commit) writes changes only if preview succeeded with **zero errors**.
- An **idempotency key** prevents double-applying the same import. If the same key is submitted twice, the CMS returns the original result instead of applying changes again.

### CSV columns

Supported columns:

- `id` (optional, ULID; required to target a specific existing product id)
- `sku`
- `title` *or* localized `title_<locale>` (for example `title_en`, `title_de`, `title_it`, `title_es`)
- `description` *or* localized `description_<locale>` (for example `description_en`, `description_de`, `description_it`, `description_es`)
- `price` (integer, cents)
- `currency` (for example `EUR`, `USD`)
- `status` (`draft` / `review` / `scheduled` / `active` / `archived`)
- `media_urls` (list of URLs, separated by `|`, `;`, or `,`)
- `publish_shops` (optional list, separated by `|`, `;`, or `,`)

### Example: publish a single draft product (CSV)

```csv
id,sku,status
01KDJWNM0PKEVQ0RAF644FE8TG,classic,active
```

### Example: create a new product with one image (CSV)

```csv
sku,title_en,description_en,price,currency,status,media_urls
green-sneaker,"Eco Runner — Green","Lightweight upper knit from recycled PET.",11900,EUR,active,"/uploads/cover-me-pretty/01J…​.jpg"
```

### Example: commit payload (JSON)

The UI accepts a JSON array or `{ "items": [...] }`. Example item:

```json
{
  "sku": "sand-sneaker",
  "status": "active",
  "title": { "en": "Eco Runner — Sand" },
  "description": { "en": "Earth-tone edition coloured with mineral pigments." },
  "price": 11900,
  "currency": "EUR",
  "media": ["/uploads/cover-me-pretty/01J…​.jpg"]
}
```

---

## E) Upload product images / media

Media can be uploaded in two places:

1) **Uploads → Media library**: `/cms/shop/<shop>/media`
2) **Product editor → Media gallery tab** (the uploader is the same backend)

### What happens when uploads run

- Files are validated for **type** and **size**.
  - Images: up to 5 MB
  - Videos: up to 50 MB
- Images can be required to be **landscape** or **portrait** depending on the selected “publish location”.
- The upload returns a stable **media URL**; use that URL in the product’s media list (via product editor or Product import `media_urls`).

### Best practices

- Always fill **alt text** (accessibility + SEO).
- Prefer uploading once and reusing the same media item across products.
- Do not paste `public/…` file paths; use the URL returned by the upload flow.

---

## F) Manage inventory (stock)

There are two stock tools. Use the right one.

### 1) Inventory matrix (absolute, “set the truth”)

Go to `/cms/shop/<shop>/data/inventory`.

Use this to:

- Add new SKUs/rows
- Correct mistakes (set quantity to the correct number)
- Delete rows (stop tracking a SKU)
- Import/export inventory in CSV/JSON

Inventory rows include:

- `sku` (required)
- `productId` (required; should match the product’s `id` or `sku`, depending on shop convention)
- `quantity` (required; must be ≥ 0)
- `variantAttributes` (optional attributes like `size`)
- Optional thresholds (for example `lowStockThreshold`)

Export format:

- CSV has columns like `sku`, `productId`, `quantity`, `lowStockThreshold`, plus variant columns like `variant.size`, `variant.color`, etc.

How to “remove from inventory”:

- Temporary out-of-stock: set `quantity = 0`
- Permanent stop-tracking: delete the row

Guardrails:

- If any row for a SKU uses variant attributes (for example `size`), **all rows for that SKU must include values for the same attributes**. The matrix will refuse saves that would create a “shadow” row missing required attributes.
- Duplicate rows for the same `(sku + variantAttributes)` are blocked.
- Click **History** on a row to see the inflow/adjustment ledger (delta, previous, next, note/reason) for that SKU/variant. Reverse logistics events will appear as informational entries when available.

### 2) Stock inflows (delta-based receiving + audit trail)

Go to `/cms/shop/<shop>/uploads/stock-inflows`.

Use this to record receiving stock shipments. Each line is a **positive quantity delta** (it adds stock).

Two-step model:

- **Preview**: validates and shows the quantity deltas that would apply.
- **Receive stock**: applies the deltas and appends an immutable receipt log.

Schema per row (all entered on the page — no CSV needed):

- `sku` (required)
- `productId` (required)
- `quantity` (required; positive integer)
- `variantAttributes` (structured fields, for example `Size` / `Color`)
- `additional variant attributes` (optional; JSON for new keys that aren’t in the structured list yet)

Guardrails in the UI:

- The page loads the current **inventory snapshot** and lets operators **pick an existing row**. Doing so auto-fills `sku`, `productId`, and variant attributes and shows `current → next` quantity for that row.
- If a `sku` + variant combination is entered that does not exist, the receipt **creates a new inventory row** (allowed, but should be intentional).
- The structured variant fields prevent “missing variantAttributes” errors; use the JSON box only when a new attribute key is required.

Idempotency:

- If the same **idempotency key** is submitted twice, the system returns the original receipt instead of receiving stock twice.

Important:

- You cannot receive negative stock (no “stock outflows”) in this tool.
- If stock must be reduced (corrections, damage, returns), use the **Inventory matrix** to set the correct quantity until the dedicated “stock adjustments” flow ships.
- If the row already exists, pick it from the dropdown so the `variantAttributes` match exactly. If a new variant must be typed, fill every variant field to avoid creating “shadow” rows.

Example receipt line (Cover‑Me‑Pretty):

```json
{ "sku": "green-sneaker-41", "productId": "green-sneaker", "quantity": 10, "variantAttributes": { "size": "41" } }
```

Example receipt line (Cochlearfit):

```json
{ "sku": "classic-adult-ocean", "productId": "classic", "quantity": 25, "variantAttributes": { "size": "adult" } }
```

### 3) Stock adjustments (positive/negative with reason + audit trail)

Go to `/cms/shop/<shop>/uploads/stock-adjustments`.

Use this to **increase or decrease** stock when correcting mistakes, logging damage/shrinkage, or returning items to stock. Each line is a **non-zero quantity delta**.

Two-step model:

- **Preview**: validates and shows the quantity deltas that would apply.
- **Apply adjustments**: applies the deltas and appends an immutable adjustment log.

Schema per row:

- `sku` (required)
- `productId` (required)
- `quantity` (required; positive or negative integer, non-zero)
- `reason` (required; one of: `correction`, `damage`, `shrinkage`, `return_to_stock`, `manual_recount`)
- `variantAttributes` (structured fields; JSON box available for new keys)

Guardrails:

- Selecting an existing inventory row auto-fills `sku`/`productId`/variant attributes and shows `current → next`.
- Reasons are mandatory. Idempotency prevents double-applying the same adjustment payload.
- Quantities are clamped to never drop below zero (a -10 against a quantity of 4 will set it to 0).

---

## G) How storefronts read and display products

### Cover‑Me‑Pretty (`cover-me-pretty`)

What customers see on `/shop` and `/product/<slug>` is computed from:

- The shop’s **active products** (catalogue records)
- The shop’s **inventory rows** (stock)

Key behaviour:

- Only products with `status = active` are shown.
- PDP “sizes” are derived from inventory `variantAttributes.size` for rows with `quantity > 0`.
- Total stock shown is the sum of matching inventory rows.
- Images/videos are rendered from the product’s `media[].url` list:
  - `/uploads/<shop>/<filename>` URLs are served by the app
  - absolute public URLs (R2) are also supported

Operational implication:

- After saving in CMS, changes should appear on the storefront on refresh (subject to deployment caching).

### Cochlearfit (`cochlearfit`)

Cochlearfit is a static export storefront. It reads shop data at build time:

- `products.json` for product copy and media ordering
- `inventory.json` for stock (each variant SKU has a quantity)
- `variants.json` for **variant pricing + Stripe price IDs**

Key behaviour:

- Only products where `status = active` are included.
- Variant pricing shown to customers (and charged in Stripe) comes from `variants.json`.
  - Editing product “Price (cents)” in the CMS does **not** change checkout pricing for cochlearfit.
  - `variants.json` is not currently editable in the CMS; updating Stripe price IDs/pricing requires a developer change.
- Variant in-stock state is derived from inventory quantity for the variant SKU.
- Media URLs can be:
  - `/uploads/cochlearfit/<filename>` (copied into the built site during build), or
  - absolute public URLs (R2)

Operational implication:

- CMS changes become customer-visible **only after the cochlearfit site is rebuilt and redeployed** (static export).
- Checkout totals follow `variants.json` (Stripe price IDs). Treat the CMS price field as display-only for cochlearfit unless variants are updated by a developer.

Locale note:

- Cochlearfit supports `en`, `it`, `es`, `de` on the storefront.
- CMS-managed product translations are currently first-class for `en`, `de`, `it`.
- Spanish (`es`) is now first-class in CMS product/editor and Product import; fill it alongside EN/DE/IT for cochlearfit and cover-me-pretty.

---

## H) Verification and validation (end-to-end)

### 1) Validation at upload/edit time

Catalogue:

- Product editor requires non-empty title/description for each CMS-enabled locale.
- Product import validates:
  - `idempotencyKey` is a UUID
  - each row is well-formed (types, status enum, non-negative prices)
  - no duplicate ids/SKUs within the import payload
  - imports are idempotent (same key returns same outcome)

Inventory:

- Inventory matrix validation enforces:
  - `sku` required
  - `productId` required
  - `quantity` integer ≥ 0
  - `variantAttributes` is an object of strings (may be empty)
  - no duplicate `(sku + variantAttributes)` rows
  - if any row for a SKU uses variant attributes (for example `size`), every row for that SKU must supply values for those attributes (prevents “missing variant” shadow rows)
- Stock inflows validation enforces:
  - `quantity` positive integer
  - `productId` must match an existing inventory row for the same `(sku + variantAttributes)` if one already exists (prevents cross-linking a SKU to the wrong product)
  - inflows are idempotent (same key returns same receipt)
- Stock adjustments validation enforces:
  - `quantity` non-zero integer (positive or negative; results are clamped to ≥ 0)
  - `reason` is required (correction, damage, shrinkage, return_to_stock, manual_recount)
  - idempotency key prevents double-applying the same adjustment

Media:

- Media upload validation enforces:
  - safe file types (image/* or video/*)
  - max size limits
  - image orientation requirements (when applicable)
  - safe storage paths (no path traversal)

### 2) Storefront visibility validation

- Product must be `status = active` to appear on `/shop`.
- Variants/sizes only appear as “available” when matching inventory quantity is > 0.
- If media URLs 404, the product still renders but images will be broken; always verify media URLs after upload.

### 3) Checkout validation (Cochlearfit)

At checkout session creation:

- Quantities are clamped to a safe range (prevents extreme quantities).
- Variant IDs must exist in the allowed catalogue list.
- Inventory is validated via the configured Inventory Authority service; if insufficient stock, checkout is blocked.

On payment completion:

- Stripe webhooks are signature-verified before recording an order record.
- Order records are persisted for reconciliation and support workflows.

### 4) Operator checklist (recommended)

After making catalogue/inventory/media changes:

1) In CMS:
   - Confirm the product is present in `/cms/shop/<shop>/products`.
   - If published: confirm status is `active` (via Product import report).
   - Confirm inventory rows exist and quantities look correct.
   - Confirm media URLs open in a new tab.
2) On storefront:
   - Visit `/<lang>/shop` and confirm the product card appears.
   - Visit `/<lang>/product/<slug>` and confirm:
     - Correct title/description
     - Correct images (and alt text, where visible)
     - Correct available sizes/variants
3) For cochlearfit only:
   - Confirm a rebuild/redeploy has completed before expecting changes to be live.
   - Run a test checkout on a low-risk SKU after any pricing or inventory changes.
4) If a 403 occurs:
   - Check the role in the CMS header. Product import/media require `manage_catalog`/`manage_media`; stock inflows and inventory matrix save require `manage_inventory` (default admin/ShopAdmin).
