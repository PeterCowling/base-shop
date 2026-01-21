// Type augmentation for @jest/environment Jest interface
// Adds isolateModulesAsync which exists in the actual Jest runtime but
// may be missing from older type definitions

import type { Jest as OriginalJest } from "@jest/environment";

declare module "@jest/environment" {
  // Augment the existing Jest interface to include isolateModulesAsync
  // This merges with the existing interface rather than replacing it
  export interface Jest {
    /**
     * Equivalent of `jest.isolateModules()` for async functions to be wrapped.
     * The caller is expected to `await` the completion of `jest.isolateModulesAsync()`.
     */
    isolateModulesAsync(fn: () => Promise<void>): Promise<void>;
  }
}
