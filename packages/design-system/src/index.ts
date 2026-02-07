// @acme/design-system - Core design system components
// This package contains presentation-only components with no domain logic.

// Atoms
export * from "./atoms";

// Molecules
export * from "./molecules";

// Primitives
export * from "./primitives";

// Utils
export * from "./utils/style";

// Types
export type * from "./types/viewport";

// Note: Button and Dialog components are re-exported from atoms for backwards compatibility.
// For direct shadcn access, use @acme/design-system/shadcn

// Hooks
export { default as useViewport } from "./hooks/useViewport";
