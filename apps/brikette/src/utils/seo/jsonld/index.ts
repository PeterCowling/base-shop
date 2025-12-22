// src/utils/seo/jsonld/index.ts
export * from "./normalize";
export * from "./article";
export * from "./howto";
export * from "./breadcrumb";

// Re-export FAQ helpers to consolidate consumption points
export {
  buildFaqJsonLd,
  faqEntriesToJsonLd,
  normalizeFaqEntries,
} from "@/utils/buildFaqJsonLd";

