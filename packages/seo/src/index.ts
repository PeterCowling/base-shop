export type { AiPluginConfig, LlmsTxtConfig } from "./ai/index.js";
export { buildAiPluginManifest, buildLlmsTxt } from "./ai/index.js";
export type { SeoAiConfig, SeoRobotsConfig, SeoSiteConfig } from "./config/index.js";
export type { AlternatesOptions, AlternatesResult, PageSeo } from "./metadata/index.js";
export {
  buildAlternates,
  buildMetadata,
  ensureNoTrailingSlash,
  ensureTrailingSlash,
} from "./metadata/index.js";
export type { RobotsConfig } from "./robots/index.js";
export { buildRobotsMetadataRoute, buildRobotsTxt } from "./robots/index.js";
export type {
  SitemapAlternatesConfig,
  SitemapEntry,
  SitemapEntryOptions,
  SitemapPage,
} from "./sitemap/index.js";
export {
  buildSitemapEntry,
  buildSitemapWithAlternates,
} from "./sitemap/index.js";
