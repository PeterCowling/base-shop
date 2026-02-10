/**
 * Declarative filter configurations matching all dorny/paths-filter
 * expressions across required CI workflows.
 *
 * Source of truth: CI-SC-04 parity map in
 * docs/plans/ci-integration-speed-control-plan.md
 */

export type FilterRule = {
  /** Glob patterns that trigger the filter (non-negated) */
  include: readonly string[];
  /** Glob patterns that exclude matches (originally prefixed with !) */
  exclude: readonly string[];
};

export type FilterConfig = Readonly<Record<string, FilterRule>>;

/**
 * ci.yml — step: filter (id: filter)
 * Gates E2E test job
 */
export const CI_FILTER: FilterConfig = {
  shop: {
    include: [
      "apps/cover-me-pretty/**",
      "apps/cms/**",
      "packages/platform-core/**",
      "packages/ui/**",
      "packages/config/**",
      "packages/i18n/**",
      "packages/shared-utils/**",
    ],
    exclude: [],
  },
};

/**
 * ci.yml — step: bos_filter (id: bos_filter)
 * Gates BOS mirror edit validation
 */
export const CI_BOS_FILTER: FilterConfig = {
  bos_guarded: {
    include: ["docs/business-os/**"],
    exclude: [
      "docs/business-os/README.md",
      "docs/business-os/business-os-charter.md",
      "docs/business-os/MANUAL_EDITS.md",
      "docs/business-os/scans/**",
      "docs/business-os/strategy/**",
      "docs/business-os/people/**",
    ],
  },
};

/**
 * merge-gate.yml — step: filter (id: filter)
 * Gates all downstream required-check workflows
 */
export const MERGE_GATE_FILTER: FilterConfig = {
  github_config: {
    include: [
      ".github/workflows/**",
      ".github/actions/**",
      ".github/dependabot.yml",
      ".github/CODEOWNERS",
    ],
    exclude: [],
  },
  core: {
    include: ["**/*"],
    exclude: [
      "apps/cms/**",
      "apps/skylar/**",
      ".github/workflows/cms.yml",
      ".github/workflows/skylar.yml",
    ],
  },
  cms_deploy: {
    include: [
      "apps/cms/**",
      "packages/config/**",
      "packages/configurator/**",
      "packages/date-utils/**",
      "packages/email/**",
      "packages/email-templates/**",
      "packages/i18n/**",
      "packages/next-config/**",
      "packages/plugins/sanity/**",
      "packages/shared-utils/**",
      "packages/theme/**",
      "packages/telemetry/**",
      "packages/zod-utils/**",
      "packages/themes/**",
      "packages/ui/**",
      "packages/platform-core/**",
      "packages/lib/**",
      "packages/types/**",
      "packages/tailwind-config/**",
      "packages/design-tokens/**",
      ".github/workflows/cms.yml",
    ],
    exclude: [],
  },
  cms_e2e: {
    include: [
      "apps/cms/**",
      "packages/config/**",
      "packages/configurator/**",
      "packages/date-utils/**",
      "packages/email/**",
      "packages/email-templates/**",
      "packages/i18n/**",
      "packages/next-config/**",
      "packages/plugins/sanity/**",
      "packages/shared-utils/**",
      "packages/theme/**",
      "packages/telemetry/**",
      "packages/zod-utils/**",
      "packages/themes/**",
      "packages/ui/**",
      "packages/platform-core/**",
      "packages/lib/**",
      "packages/types/**",
      "packages/tailwind-config/**",
      "packages/design-tokens/**",
      ".github/workflows/cypress.yml",
    ],
    exclude: [],
  },
  skylar: {
    include: [
      "apps/skylar/**",
      "packages/config/**",
      "packages/i18n/**",
      "packages/next-config/**",
      "packages/tailwind-config/**",
      "packages/ui/**",
      "packages/platform-core/**",
      "packages/shared-utils/**",
      "packages/themes/**",
      "packages/design-tokens/**",
      ".github/workflows/skylar.yml",
    ],
    exclude: [],
  },
  brikette: {
    include: [
      "apps/brikette/**",
      "packages/design-system/**",
      "packages/design-tokens/**",
      "packages/guides-core/**",
      "packages/next-config/**",
      "packages/platform-core/**",
      "packages/telemetry/**",
      "packages/ui/**",
      ".github/workflows/brikette.yml",
      ".github/workflows/reusable-app.yml",
    ],
    exclude: [],
  },
  prime: {
    include: [
      "apps/prime/**",
      "packages/design-system/**",
      "packages/design-tokens/**",
      "packages/next-config/**",
      "packages/tailwind-config/**",
      "packages/themes/**",
      "packages/ui/**",
      ".github/workflows/prime.yml",
    ],
    exclude: [],
  },
  product_pipeline: {
    include: [
      "apps/product-pipeline/**",
      "packages/next-config/**",
      "packages/tailwind-config/**",
      "packages/design-tokens/**",
      "packages/themes/**",
      "packages/pipeline-engine/**",
      "packages/ui/**",
      ".github/workflows/product-pipeline.yml",
    ],
    exclude: [],
  },
  storybook: {
    include: [
      "apps/storybook/**",
      "apps/cms/**",
      "apps/cover-me-pretty/**",
      "packages/ui/**",
      "packages/design-tokens/**",
      "packages/tailwind-config/**",
      "packages/themes/**",
      "packages/theme/**",
      "packages/i18n/**",
      "packages/shared-utils/**",
      "packages/config/**",
      "packages/types/**",
      "docs/storybook.md",
      ".github/workflows/storybook.yml",
    ],
    exclude: [],
  },
  consent_analytics: {
    include: [
      "apps/cover-me-pretty/src/app/api/analytics/**",
      "apps/cover-me-pretty/src/app/api/leads/**",
      "packages/platform-core/src/analytics/**",
      "packages/platform-core/src/contexts/CartContext.tsx",
      ".github/workflows/consent-analytics.yml",
    ],
    exclude: [],
  },
  lhci: {
    include: [
      "apps/cover-me-pretty/**",
      "apps/skylar/**",
      ".lighthouseci/**",
      "lighthouserc*.json",
      ".github/workflows/ci-lighthouse.yml",
    ],
    exclude: [],
  },
};

/**
 * ci-lighthouse.yml — step: filter (id: filter)
 * Gates LHCI job
 */
export const LIGHTHOUSE_FILTER: FilterConfig = {
  shop_skylar: {
    include: [
      "apps/cover-me-pretty/**",
      "apps/skylar/**",
      ".lighthouseci/**",
      "lighthouserc*.json",
      ".github/workflows/ci-lighthouse.yml",
    ],
    exclude: [],
  },
};

/** All named filter configs for CLI lookup */
export const FILTER_CONFIGS: Record<string, FilterConfig> = {
  ci_filter: CI_FILTER,
  ci_bos_filter: CI_BOS_FILTER,
  merge_gate: MERGE_GATE_FILTER,
  lighthouse: LIGHTHOUSE_FILTER,
};
