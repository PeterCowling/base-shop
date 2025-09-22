// packages/ui/src/components/cms/page-builder/icons.ts
// Central mapping to plug in final left-rail icon assets.
// Drop your PNG/SVG assets under the host app's public/ path
// (e.g., /public/editor-icons/*.svg) and update the paths below.

export const leftRailIconAssets: Partial<Record<
  | "add"
  | "layers"
  | "pages"
  | "globalSections"
  | "siteStyles"
  | "appMarket"
  | "cms"
  | "code"
  | "inspector",
  string
>> = {
  // Monochrome line PNGs (16–19px). Place these under the host app's
  // `public/editor-icons/` directory. These paths are absolute from public/.
  add: "/editor-icons/add.png",
  layers: "/editor-icons/layers.png",
  pages: "/editor-icons/pages.png",
  globalSections: "/editor-icons/global-sections.png",
  siteStyles: "/editor-icons/site-styles.png",
  appMarket: "/editor-icons/app-market.png",
  cms: "/editor-icons/cms.png",
  code: "/editor-icons/code.png",
  inspector: "/editor-icons/inspector.png",
};
