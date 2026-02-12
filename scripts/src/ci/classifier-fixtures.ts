export const DEPLOY_ONLY_EXACT_PATHS = new Set<string>([
  ".github/workflows/brikette.yml",
  ".github/workflows/reusable-app.yml",
  "apps/brikette/wrangler.toml",
  "apps/brikette/next.config.js",
  "apps/brikette/next.config.mjs",
  "apps/brikette/next.config.ts",
  "scripts/post-deploy-brikette-cache-check.sh",
  "scripts/post-deploy-health-check.sh",
  "scripts/validate-deploy-env.sh",
]);

export const DEPLOY_ONLY_PATH_PREFIXES = [
  "apps/brikette/.github/",
  "apps/brikette/deploy/",
] as const;

export const BRIKETTE_RELEVANT_EXACT_PATHS = new Set<string>([
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "turbo.json",
  "tsconfig.base.json",
  "tsconfig.json",
  "jest.config.cjs",
  "jest.config.helpers.cjs",
  "jest.moduleMapper.cjs",
  "jest.setup.ts",
  "eslint.config.mjs",
]);

export const BRIKETTE_RELEVANT_PATH_PREFIXES = [
  "apps/brikette/",
  "packages/design-system/",
  "packages/design-tokens/",
  "packages/guide-system/",
  "packages/guides-core/",
  "packages/next-config/",
  "packages/platform-core/",
  "packages/telemetry/",
  "packages/ui/",
  "scripts/src/",
  "scripts/__tests__/",
  "data/shops/brikette/",
] as const;

export const RUNTIME_PATH_PREFIXES = [
  "apps/brikette/",
  "packages/design-system/",
  "packages/design-tokens/",
  "packages/guide-system/",
  "packages/guides-core/",
  "packages/next-config/",
  "packages/platform-core/",
  "packages/telemetry/",
  "packages/ui/",
  "scripts/src/",
  "scripts/__tests__/",
  "data/shops/brikette/",
] as const;

export const RELATED_TEST_SOURCE_PATH_PREFIXES = [
  "apps/brikette/src/",
  "apps/brikette/test/",
  "packages/design-system/src/",
  "packages/design-tokens/src/",
  "packages/guide-system/src/",
  "packages/guides-core/src/",
  "packages/next-config/src/",
  "packages/platform-core/src/",
  "packages/telemetry/src/",
  "packages/ui/src/",
] as const;

export const RELATED_TEST_SOURCE_FILE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
] as const;
