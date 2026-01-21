"use client";

/**
 * @deprecated Import from '@acme/design-system/atoms' instead.
 * This re-export will be removed in a future version.
 */

// Show deprecation warning in development
if (process.env.NODE_ENV === "development") {
  console.warn(
    "[@acme/ui] Importing from '@acme/ui/atoms' is deprecated. " +
    "Please import from '@acme/design-system/atoms' instead."
  );
}

// Re-export everything from design-system atoms
export * from "@acme/design-system/atoms";
