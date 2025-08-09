# CMS Navigation Guide

This document describes how to navigate the in-browser CMS and what each link in the sidebar does.

## Sidebar Links

The sidebar inside the CMS provides quick access to different sections:

- **Dashboard** – Shows shop statistics and pending account requests.
- **Products** – Lists all products. If a shop is selected, also shows **New Product**.
- **Pages** – Lists pages for the current shop with a **New Page** link when a shop is selected.
- **Media** – Upload and manage media files.
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
2. Pick a component from the list and adjust its options in the side panel.
3. Confirm to insert the block onto the page.

### Rearrange blocks

- Select a block to reveal drag handles, then drag it to a new position.
- Blocks can be resized directly on the canvas. Adjust margin and padding from
  the side panel before saving.

### Publish changes

1. Use **Save** to keep a draft version.
2. Click **Publish** when you're ready for the page to go live at
   `/shop/{shop}/{slug}`.
