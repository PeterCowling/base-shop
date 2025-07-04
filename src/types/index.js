// src/types/index.ts
// Re-export shared types from the "types" package's source directory.
// The previous path pointed to the compiled output (`dist`), but the package
// does not ship prebuilt files in this repository. By referencing the source
// files directly we make the types available to consumers without requiring an
// additional build step.
export * from "../../packages/types/src";
