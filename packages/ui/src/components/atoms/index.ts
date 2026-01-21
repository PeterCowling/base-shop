"use client";

/**
 * @deprecated Import from '@acme/design-system/atoms' or '@acme/design-system/primitives' instead.
 * This barrel re-exports from @acme/design-system for backward compatibility.
 */

// Show deprecation warning in development
if (process.env.NODE_ENV === "development") {
  console.warn(
    "[@acme/ui] Importing from '@acme/ui/atoms' or '@acme/ui/components/atoms' is deprecated. " +
    "Please import from '@acme/design-system/atoms' or '@acme/design-system/primitives' instead."
  );
}

// Re-export atoms from design-system
export * from "@acme/design-system/atoms";

// Re-export primitives from design-system (for backward compat - previously exported from this barrel)
export * from "@acme/design-system/primitives";
