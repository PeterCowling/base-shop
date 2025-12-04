Type: Guide
Status: Active
Domain: CMS
Last-reviewed: 2025-12-02

# Sanity Blog Integration

Shop owners can connect a Sanity project to manage blog posts alongside the shop catalog. Follow these steps to enable and use the integration.

## Schema

When setting up the connection the CMS seeds a minimal schema. Posts include a `mainImage` field using Sanity's `image` type and a `categories` field that stores references to `category` documents. A `category` document contains a `title` and generated `slug` so categories can be reused across posts.

## Connect your Sanity project

1. Obtain your **project ID**, **dataset**, and an API **token** from the Sanity dashboard.
2. In the CMS go to **Settings → Blog** and enter the credentials, then choose whether the dataset should be **public** or **private**.
3. The CMS uses the values to verify access via the `verifyCredentials` helper from the plugin.
4. On success the connection is stored with the shop settings.

## Enable or disable editorial content

The blog can be toggled in **Settings → Shop** using the **Enable blog** checkbox. This sets the `luxuryFeatures.blog` flag in the shop settings. When disabled the storefront hides blog routes and the daily publication job skips the shop.

To automatically surface the "Daily Edit" on the storefront home page, provide a `promoteSchedule` ISO timestamp. When set the CMS schedules a front‑page promotion at the chosen time.

## Daily publication job

A scheduled worker runs once per day and calls `@acme/sanity` to publish the next queued post for every shop. This keeps editorial content fresh without manual intervention. Shops that prefer not to use editorial content can simply leave the blog disabled; the worker will ignore them.

## Publish posts

1. In **Blog → New Post** fill out the post details.
2. Submitting the form sends the data to a server action which calls `publishPost` from the plugin.
3. The post is created in Sanity and becomes available on the storefront.

## Manage existing posts

- Use the **Blog** section to list drafts and published posts.
- Editing a post triggers the same server action with updated fields.
- Deleting a post removes it from Sanity.

The plugin uses the official [`@sanity/client`](https://www.sanity.io/docs/js-client) to interact with the API. All calls are server‑side so tokens are never exposed to browsers.
