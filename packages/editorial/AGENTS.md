# editorial — Agent Notes

## Purpose
Read and render storefront blog content from `DATA_ROOT/<shop>/blog` using
lightweight front-matter parsing and Markdown-to-HTML rendering.

## Operational Constraints
- Server-only module: uses Node `fs` and `path`; keep imports server-safe.
- `DATA_ROOT` is the canonical source; do not hardcode paths.
- Slug generation and sorting must remain stable (affects URLs).
- Front-matter parser must remain permissive and backward compatible.

## Safe Change Checklist
- Preserve `fetchPublishedPosts` and `fetchPostBySlug` return shapes.
- Keep `renderMarkdownToHtml` dependency chain compatible with server runtime.
- Avoid breaking changes to `EditorialPost` without updating consumers.
