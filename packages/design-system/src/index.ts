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

// Shadcn - only export the custom Button wrapper (primitives already exported above)
export { Button as ShadcnButton, type ButtonProps as ShadcnButtonProps } from "./shadcn/Button";

// Hooks
export { default as useViewport } from "./hooks/useViewport";
