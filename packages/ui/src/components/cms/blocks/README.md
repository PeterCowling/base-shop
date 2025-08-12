# CMS Blocks

Reusable content blocks for the page builder. Each block accepts optional
`width`, `height`, `margin` and `padding` props so editors can control layout
per instance. Blocks that render lists of items—such as `ProductGrid`,
`ProductCarousel` and `RecommendationCarousel`—also support `minItems` and
`maxItems` to clamp how many entries are shown at different viewport sizes.

## Adding blocks

To register a new block, simply add a `.tsx` file in this directory (or a
subdirectory) that default exports a React component. The block registry uses
file-based discovery via `import.meta.glob`, so new blocks become available to
the page builder automatically—no manual updates to `index.tsx` are required.

Storybook (`*.stories.tsx`) and test files are ignored during discovery.
