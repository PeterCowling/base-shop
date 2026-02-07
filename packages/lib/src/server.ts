// Re-export all universal exports
export * from "./index";

// Server-only additions from @acme/shared-utils migration
export * from "./context/index.server";
export * from "./http/index.server";
export * from "./logger/index.server";

// Server-only: generateMeta (uses fs module)
export type { GeneratedMeta, ProductData } from "./generateMeta";
export { generateMeta } from "./generateMeta";
