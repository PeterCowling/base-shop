# Sanity Blog Integration

Shop owners can connect a Sanity project to manage blog posts alongside the shop catalog. Follow these steps to enable and use the integration.

## Connect your Sanity project

1. Obtain your **project ID**, **dataset**, and an API **token** from the Sanity dashboard.
2. In the CMS go to **Settings → Blog** and enter the credentials, then choose whether the dataset should be **public** or **private**.
3. The CMS uses the values to verify access via the `verifyCredentials` helper from the plugin.
4. On success the connection is stored with the shop settings.

## Publish posts

1. In **Blog → New Post** fill out the post details.
2. Submitting the form sends the data to a server action which calls `publishPost` from the plugin.
3. The post is created in Sanity and becomes available on the storefront.

## Manage existing posts

- Use the **Blog** section to list drafts and published posts.
- Editing a post triggers the same server action with updated fields.
- Deleting a post removes it from Sanity.

The plugin uses the official [`@sanity/client`](https://www.sanity.io/docs/js-client) to interact with the API. All calls are server‑side so tokens are never exposed to browsers.
