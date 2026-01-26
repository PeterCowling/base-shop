// src/utils/seo/jsonld/index.ts
export * from "./article";
export * from "./breadcrumb";
export * from "./howto";
export * from "./normalize";
export * from "./serialize";

// Re-export FAQ helpers to consolidate consumption points
export {
  buildFaqJsonLd,
  faqEntriesToJsonLd,
  normalizeFaqEntries,
} from "@/utils/buildFaqJsonLd";
