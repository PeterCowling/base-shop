// file path: src/locales/guides.test-helpers.ts
// -----------------------------------------------------------------------------
// Test helpers for the `guides` namespace API.
// -----------------------------------------------------------------------------

import type { ModuleOverrides } from "./guides.types";
import { resetGuidesState } from "./guides.state";

export function __setGuidesModulesForTests(overrides?: ModuleOverrides): void {
  resetGuidesState(overrides);
}

