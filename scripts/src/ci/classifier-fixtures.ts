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

export const RUNTIME_PATH_PREFIXES = [
  "apps/",
  "packages/",
  "scripts/src/",
  "scripts/__tests__/",
  "src/",
  "test/",
  "tests/",
  "data/",
] as const;
