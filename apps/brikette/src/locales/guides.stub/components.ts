// file path: src/locales/guides.stub/components.ts
// -----------------------------------------------------------------------------
// Component-level copy used by page chrome in tests (fallback only).
// -----------------------------------------------------------------------------

/* eslint-disable ds/no-hardcoded-copy -- TECH-000: Test-only stub copy for Vitest fallback; not shipped UI. [ttl=2026-12-31] */

export const components = {
  planChoice: {
    title: "Choose your plan",
    options: {
      ferry: "Ferry (seasonal)",
      trainBus: "Train + Bus (year-round)",
      transfer: "Private transfer",
    },
    selectedLabel: "Selected:",
  },
} as const;

/* eslint-enable ds/no-hardcoded-copy -- TECH-000 */

