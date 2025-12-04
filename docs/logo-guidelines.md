Type: Guide
Status: Active
Domain: Design
Last-reviewed: 2025-12-02

# Logo Usage Guidelines

Components that render a shop logo must:

- Accept a `shopName` prop.
- Pass `shopName` to the `Logo` component or use it as textual fallback when no image is available.
- Ensure `shopName` is used for the image `alt` attribute.
- Display `shopName` text when no logo image is provided.

Following these rules keeps branding and accessibility consistent across the codebase.
