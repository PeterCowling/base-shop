"use client";

// DEPRECATED: Import from @acme/design-system/hooks instead
if (process.env.NODE_ENV === "development") {
  console.warn(
    "[@acme/ui] Importing 'useViewport' from '@acme/ui/hooks' is deprecated. " +
      "Please import from '@acme/design-system/hooks' instead."
  );
}

export { default } from "@acme/design-system/hooks/useViewport";
