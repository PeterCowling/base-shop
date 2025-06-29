// src/types/index.ts

// Re-export compiled shared types from the "types" package.
// This prevents TypeScript from treating the source files of that package as
// part of the current compilation unit, avoiding rootDir errors in packages
// that consume these types.
export * from "../../packages/types/dist";
