// Re-export all universal exports
export * from "./index.js";

// Server-only additions from @acme/shared-utils migration
export * from "./context/index.server.js";
export * from "./http/index.server.js";
export * from "./logger/index.server.js";

// Server-only: generateMeta (uses fs module)
export type { GeneratedMeta, ProductData } from "./generateMeta.js";
export { generateMeta } from "./generateMeta.js";

// Server-only: growth ledger persistence (uses fs module)
export * from "./growth/store.js";
