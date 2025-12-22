// file path: src/locales/guides.stub/transportNotice.ts
// -----------------------------------------------------------------------------
// Transport notice strings used in tests when FS loaders aren't hydrated.
// -----------------------------------------------------------------------------

/* eslint-disable ds/no-hardcoded-copy -- TECH-000: Test-only stub copy for Vitest fallback; not shipped UI. [ttl=2026-12-31] */

export const transportNotice = {
  srLabel: "Transport information",
  title: "Transport tips",
  items: {
    buses: "Use SITA buses (validate tickets).",
    ferries: "Ferries are seasonal; check operators.",
    airlink: "Airport buses connect in season.",
    driving: "Driving is challenging; parking limited.",
    premium: "Private transfers are most convenient but costly.",
  },
} as const;

/* eslint-enable ds/no-hardcoded-copy -- TECH-000 */

