# Sanity Blog Integration

Shop owners can connect a Sanity project to publish and manage blog posts alongside their storefront.

## 1. Create a Sanity project

1. Sign up at [sanity.io](https://www.sanity.io/) and create a new project.
2. Note the **project ID**, **dataset**, and an API **token** with write access.

## 2. Enable the plugin

1. Update `packages/plugins/sanity/index.ts` with your project details or supply them at runtime.
2. The plugin exposes a `sanity-blog` widget that surfaces posts inside the shop.
3. Run `pnpm build` to include the plugin in the platform.

## 3. Connect from the CMS

1. Visit the CMS and open the *Blog* section.
2. Enter the project ID, dataset, and token. Submit the form to establish the connection.
3. The connection is stored server‑side using the `connectSanity` action.

## 4. Manage posts

1. After connecting, create or edit posts from the CMS.
2. Drafts can be previewed and published to your storefront using Sanity's workflow.
3. Disconnecting the blog simply removes the credentials; content remains in Sanity.

## Troubleshooting

- Verify that the token has *Editor* rights.
- Check your dataset name; the default is usually `production`.
- Ensure the plugin is installed and appears in the CMS settings.

This guide covers the basics of wiring a Sanity blog into the platform so shop owners can publish content without leaving the dashboard.
