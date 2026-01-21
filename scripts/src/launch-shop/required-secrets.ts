// scripts/src/launch-shop/required-secrets.ts
/**
 * MVP hardcoded secrets registry per deploy target type.
 * Post-MVP: Move to packages/platform-core/src/deploy/required-secrets.ts
 * with richer typing, per-shop overrides, and runtime secret validation.
 */

export const REQUIRED_SECRETS = {
  "cloudflare-pages": {
    github: ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "TURBO_TOKEN"],
    provider: [], // MVP doesn't verify provider-side secrets
  },
  vercel: {
    github: ["VERCEL_TOKEN", "TURBO_TOKEN"],
    provider: [],
  },
  local: {
    github: [],
    provider: [],
  },
} as const;

export type DeployTargetType = keyof typeof REQUIRED_SECRETS;

export function getRequiredGitHubSecrets(
  deployType: DeployTargetType
): readonly string[] {
  return REQUIRED_SECRETS[deployType]?.github ?? [];
}
