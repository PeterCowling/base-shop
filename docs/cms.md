# CMS Navigation Guide

This document describes how to navigate the in-browser CMS and what each link in the sidebar does.

For role and permission details, see the [permission guide](./permissions.md).

Disk-backed repositories allow the CMS to run without an external database. See [persistence](./persistence.md) for how `DATA_ROOT` controls where this data is stored.

## Sidebar Links

The sidebar inside the CMS provides quick access to different sections:

- **Dashboard** – Shows shop statistics and pending account requests.
- **Products** – Lists all products. If a shop is selected, also shows **New Product**.
- **Pages** – Lists pages for the current shop with a **New Page** link when a shop is selected.
- **Media** – Upload and manage media files.
- **Theme** – Customize the shop's appearance. Visible to admins and shop owners. See [advanced theming](./theming-advanced.md) for base themes, overrides, persistence and live preview.
- **Settings** – Shop settings. When a shop is active an additional **SEO** option appears.
- **Live** – Opens a list of running shop instances.
- **RBAC** – (Admin only) Manage user roles.
- **Account Requests** – (Admin only) Approve new user accounts.
- **Create Shop** – (Admin only) Launch the configurator for creating a new shop.

Links such as **New Product**, **New Page** and **SEO** only appear after picking a shop, otherwise they are hidden.

## Switching Shops

Use the shop selector in the top bar to change which shop you are editing. The selector fetches available shops from `/api/shops` and updates the current route accordingly. Once you select a shop, the sidebar links update to include actions specific to that shop.

## Admin‑only Routes

Certain pages are restricted to users with the `admin` role:

- `/cms/rbac` – user management and role assignment.
- `/cms/account-requests` – approve pending sign‑ups.
- `/cms/configurator` – step‑by‑step workflow for creating a new shop.

Attempting to access these pages without the proper role will redirect back to the CMS dashboard.

## Shop Configurator

Admins can scaffold and launch a shop directly from the CMS at `/cms/configurator`. The configurator guides you through:

1. **Shop Details** – provide the shop ID, display name, logo URL, contact email and shop type.
2. **Theme** – pick a base theme.
3. **Tokens** – tweak design tokens to match your brand. See [advanced theming](./theming-advanced.md) for details.
4. **Options** – select the starter template and plugins.
5. **Navigation** – build the header navigation tree or start from presets.
6. **Layout** – choose overall page layouts.
7. **Home Page** – configure the home page layout.
8. **Checkout Page** – configure the checkout experience.
9. **Shop Page** – configure the product listing page.
10. **Product Page** – configure the product detail page.
11. **Additional Pages** – optionally set up extra pages.
12. **Environment Variables** – supply required environment variables.
13. **Summary** – review selections and launch the shop.
14. _(Optional)_ **Import Data**, **Seed Data** and **Hosting** steps for existing content, sample data and deployment settings.

Progress saves automatically via the `cms-configurator-progress` key and the `/cms/api/configurator-progress` endpoint. Returning to `/cms/configurator` resumes from the last completed step.

## Configurator Resume & Page Drafts

The shop configurator now resumes where you left off. If you log in via
`/login?callbackUrl=/cms/configurator` or return to `/cms/configurator` later, the flow jumps
to your last completed step so you can continue configuring the shop without
starting over.

When building pages, the **Save** button stores the current state as a draft.
Draft pages keep `status: "draft"` in the database via Prisma, with `pages.json` used only as a filesystem fallback, until you click **Publish**.
Edit drafts at `/cms/shop/{shop}/pages/{slug}/builder` or start a new page at
`/cms/shop/{shop}/pages/new/builder`. A list of pages (including drafts) is
available via `GET /cms/api/pages/{shop}`.

## Page Builder

Open `/cms/shop/{shop}/pages/{slug}/builder` to edit an existing page or
`/cms/shop/{shop}/pages/new/builder` to start from scratch.

### Add blocks

1. Click **Add Block** in the toolbar or hover near a section and press the **+**
   button.
2. Drag a component from the picker onto the canvas or click it to insert.
3. Adjust its options in the side panel before confirming.

_Short description: drag the desired block from the list onto the canvas to add it._

### Rearrange blocks

- Select a block to reveal drag handles, then drag it to a new position.

### Resize blocks

- Select a block to expose **Width** and **Height** fields in the sidebar for exact dimensions.
- Drag the block's corner handles to resize directly on the canvas; hold **Shift** or release near the edge to snap to 100% width or height.
- Adjust margin and padding from the side panel before saving.

_Short description (manual): type exact width and height values in the sidebar for precise sizing._
_Short description (drag): corner handles highlight when the block snaps to full size with **Shift** or when released near the canvas edge._

### Keyboard & screen reader support

- Press <kbd>Space</kbd> to grab the selected block, use the arrow keys to move
  it, then press <kbd>Space</kbd> again to drop it.
- Screen readers announce when blocks are moved or added to the canvas.

### Product grids and carousels

Blocks that show multiple products can define exact counts for each device
size. Use **Desktop Items**, **Tablet Items** and **Mobile Items** to set the
visible product count per viewport. If these fields are left blank, the block
falls back to the **Min Items**/**Max Items** range and adjusts automatically
based on available width.

### Publish changes

1. Use **Save** to keep a draft version.
2. Click **Publish** when you're ready for the page to go live at
   `/shop/{shop}/{slug}`.

## Rental deposits

Returned rental orders have their deposits refunded automatically by a background process. Administrators can adjust the schedule or run the process manually; see [machine](./machine.md#deposit-release-service) for details on configuration and usage.
