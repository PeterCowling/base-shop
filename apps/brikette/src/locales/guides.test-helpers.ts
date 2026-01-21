// file path: src/locales/guides.test-helpers.ts
// -----------------------------------------------------------------------------
// Test helpers for the `guides` namespace API.
// -----------------------------------------------------------------------------

import { resetGuidesState } from "./guides.state";
import type { ModuleOverrides } from "./guides.types";

export function __setGuidesModulesForTests(overrides?: ModuleOverrides): void {
  resetGuidesState(overrides);
}

