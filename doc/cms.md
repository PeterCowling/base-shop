# CMS Navigation Guide

This document describes how to navigate the in-browser CMS and what each link in the sidebar does.

For role and permission details, see the [permission guide](./permissions.md).

## Sidebar Links

The sidebar inside the CMS provides quick access to different sections:

- **Dashboard** – Shows shop statistics and pending account requests.
- **Products** – Lists all products. If a shop is selected, also shows **New Product**.
- **Pages** – Lists pages for the current shop with a **New Page** link when a shop is selected.
- **Media** – Upload and manage media files.
- **Theme** – Customize the shop's appearance. Visible to admins and shop owners. See [advanced theming](../docs/theming-advanced.md) for base themes, overrides, persistence and live preview.
- **Settings** – Shop settings. When a shop is active an additional **SEO** option appears.
- **Live** – Opens a list of running shop instances.
- **RBAC** – (Admin only) Manage user roles.
- **Account Requests** – (Admin only) Approve new user accounts.
- **Create Shop** – (Admin only) Launch the wizard for creating a new shop.

Links such as **New Product**, **New Page** and **SEO** only appear after picking a shop, otherwise they are hidden.

## Switching Shops

Use the shop selector in the top bar to change which shop you are editing. The selector fetches available shops from `/api/shops` and updates the current route accordingly. Once you select a shop, the sidebar links update to include actions specific to that shop.

## Admin‑only Routes

Certain pages are restricted to users with the `admin` role:

- `/cms/rbac` – user management and role assignment.
- `/cms/account-requests` – approve pending sign‑ups.
- `/cms/wizard` – step‑by‑step workflow for creating a new shop.

Attempting to access these pages without the proper role will redirect back to the CMS dashboard.

## Shop Creation Wizard

Admins can scaffold and launch a shop directly from the CMS at `/cms/wizard`. The workflow proceeds through these steps:

1. **Shop details** – provide the shop ID, display name, logo URL, contact email and choose whether it's for sales or rentals.
2. **Options** – select the starter template and theme.
3. **Theme tokens** – tweak design tokens to match your brand. See [advanced theming](../docs/theming-advanced.md) for details.
4. **Navigation** – build the header navigation tree or start from prebuilt presets.
5. **Page layouts** – configure home, shop, product and checkout pages and any optional additional pages.
6. **Environment** – supply required environment variables.
7. **Seed/Import data** – seed example products or import existing data.
8. **Hosting** – optionally provision CI and deployment settings.
9. **Summary** – review all selections and launch the shop.

Progress saves automatically, so returning to `/cms/wizard` resumes from the last completed step.

## Wizard Resume & Page Drafts

The shop creation wizard now resumes where you left off. If you log in via
`/login?callbackUrl=/cms/wizard` or return to `/cms/wizard` later, the flow jumps
to your last completed step so you can continue configuring the shop without
starting over.

When building pages, the **Save** button stores the current state as a draft.
Draft pages keep `status: "draft"` in `pages.json` until you click **Publish**.
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

Returned rental orders have their deposits refunded automatically by a background process. Administrators can adjust the schedule or run the process manually; see [doc/machine.md](./machine.md#deposit-release-service) for details on configuration and usage.
