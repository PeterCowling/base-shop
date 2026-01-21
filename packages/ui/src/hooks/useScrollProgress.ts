"use client";

// DEPRECATED: Import from @acme/design-system/hooks instead
if (process.env.NODE_ENV === "development") {
  console.warn(
    "[@acme/ui] Importing 'useScrollProgress' from '@acme/ui/hooks' is deprecated. " +
      "Please import from '@acme/design-system/hooks' instead."
  );
}

export { useScrollProgress, type ScrollProgress } from "@acme/design-system/hooks/useScrollProgress";
