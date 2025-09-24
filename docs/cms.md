# CMS Navigation Guide

This document describes how to navigate the in-browser CMS and what each link in the sidebar does.

For role and permission details, see the [permission guide](./permissions.md).

Disk-backed repositories allow the CMS to run without an external database. See [persistence](./persistence.md) for how `DATA_ROOT` controls where this data is stored.

## Navigation Menu

The CMS navigation is now a dropdown menu in the top bar. It provides quick access to different sections:

- **Dashboard** – Shows shop statistics and pending account requests.
- **Products** – Lists all products. If a shop is selected, also shows **New Product**.
- **Pages** – Lists pages for the current shop with a **Create new page** link when a shop is selected.
- **Media** – Upload and manage media files.
- **Theme** – Customize the shop's appearance. Visible to admins and shop owners. See [advanced theming](./theming-advanced.md) for base themes, overrides, persistence and live preview.
- **Settings** – Shop settings. When a shop is active an additional **SEO** option appears.
- **Live** – Opens a list of running shop instances.
- **RBAC** – (Admin only) Manage user roles.
- **Account Requests** – (Admin only) Approve new user accounts.
- **Create Shop** – (Admin only) Launch the configurator for creating a new shop.

Links such as **New Product**, **Create new page** and **SEO** only appear after picking a shop, otherwise they are hidden.

## Switching Shops

Use the shop selector in the top bar to change which shop you are editing. The selector fetches available shops from `/api/shops` and updates the current route accordingly. Once you select a shop, the menu updates to include actions specific to that shop.

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
4. **Options** – select a base template and plugins.
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

### Test selectors

Interactive fields in these steps expose `data-cy` attributes (for example,
`shop-id` or `save-return`) so tests can target elements via Testing
Library's `getByTestId` configured for `data-cy`.

Progress saves automatically via the `cms-configurator-progress` key and the `/cms/api/configurator-progress` endpoint. Returning to `/cms/configurator` resumes from the last completed step.

## Upgrade & rollback workflows

Each shop dashboard (`/cms/shop/{shop}`) surfaces quick actions for the
templating workflow:

- **Upgrade & preview** triggers the `/api/upgrade-shop` endpoint. The CMS runs
  `pnpm ts-node scripts/src/upgrade-shop.ts <shop>` on the server, stages the
  latest template components and redirects to
  `/cms/shop/{shop}/upgrade-preview` when successful. The upgrade preview page
  summarises component changes (new vs. updated) and renders each entry with
  sample props via `@ui/components/ComponentPreview`. When a package exposes a
  changelog the preview lists it alongside the component so reviewers can open
  the markdown file directly from the CMS. Use the CLI republish flow documented
  in [upgrade-preview-republish](./upgrade-preview-republish.md) after confirming
  the preview looks correct.
- **View upgrade steps** simply surfaces a toast explaining that the background
  job keeps running—useful if a review takes longer than expected.
- **Rollback to previous version** calls `/api/shop/{shop}/rollback`, which
  executes `pnpm ts-node scripts/src/rollback-shop.ts <shop>` and restores the
  last published template snapshot. A toast confirms when the request is queued.

Permissions mirror the underlying routes: `manage_pages` is required to stage
upgrades or open the preview, while `manage_orders` is needed to trigger the
rollback. Users without the necessary permission see a `401` response and the UI
displays a failure toast.

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

### Sections workflow (new)

- Build pages from whole Sections. Enable `NEXT_PUBLIC_PB_SECTIONS_ONLY=true` to restrict page root to `Section` nodes and default the editor to the Sections palette.
- Use the left rail → Sections to browse reusable sections and insert into the page:
  - Insert copy: clones the section’s component tree with new IDs.
  - Insert linked: saves the section as a Global and inserts a linked instance (use the Inspector to manage it later). Globals are stored under `DATA_ROOT/<shop>/globals.json`.
  - Search and tags: the panel supports text search and tag filtering. When many sections exist, use “Load more” to paginate.

### Section Builder

- Create and curate reusable Sections at:
  - `/cms/shop/{shop}/sections` (list)
  - `/cms/shop/{shop}/sections/new/builder` (new)
  - `/cms/shop/{shop}/sections/{id}/builder` (edit)
- Section Builder focuses the UI on section composition:
  - Elements palette opens by default; page-only controls (Pages/Globals/Site Styles/CMS) are hidden.
  - Insertions target the selected Section automatically.
- Section Templates support draft/publish and optional tags/thumbnail.

### Pages Panel (in‑editor)

- Open the Pages drawer from the left rail (Pages icon). This now opens a panel inside the editor instead of redirecting to the Pages route.
- Capabilities:
  - Search pages by title/slug
  - Add a draft page
  - Reorder (Move up/down) and Hide/Show
  - Inline Settings for the selected page:
    - Page Info (Title, Slug)
    - Permissions (Visibility, allowed roles — stub)
    - SEO Basics (Title, Description, Noindex)
    - Social Share (OG Title/Description/Image + preview)
- Persistence: current implementation is local (stub). A “Save Draft” button emits a `pb:notify` event for future integration. To persist, wire these actions to your `/cms/api/pages/:shop` endpoints.

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
