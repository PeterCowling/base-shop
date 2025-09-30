# Editorial Blog (MDX)

Sprint 6 scaffolds a lightweight editorial blog backed by MD/MDX files on disk.
It complements the Sanity integration and is useful for shops that prefer a
content-in-repo workflow.

- Location: `data/shops/<shop>/blog/*.mdx`
- Front matter: `title`, `slug`, `excerpt` (optional)
- Front matter: `title`, `slug`, `excerpt`, `author`, `categories`, `products`, `date` (all optional)
- Rendering: ISR enabled (60s). Raw MDX is currently rendered as paragraphs in
  the storefront; a compiler will be wired next.

## Enable

- Set `luxuryFeatures.blog: true` in the shop settings JSON.
- Omit `sanityBlog` to use the editorial provider for that shop.
- Dev override: set `FORCE_EDITORIAL_BLOG=1` to prefer Editorial when both
  Editorial and Sanity are configured.

## Add a Post

Create a file at `data/shops/<shop>/blog/my-post.mdx`:

```
---
title: My First Post
slug: my-first-post
excerpt: A short description for listing cards.
author: Jane Author
categories: news, launch
products: cool-sneaker, classic-boot
date: 2025-09-29
---

# My First Post

Write content in MDX. Shortcodes/components will be supported in the next step.
```

## API and Sorting

- Listing: `/api/blog/posts/<shop>` returns `{ title, slug, excerpt }[]`.
- Provider: the storefront picks Sanity first when configured; otherwise uses
  the editorial loader.
- Sorting: posts with `date` are sorted descending by date; posts without `date`
  appear after dated posts.
