/**
 * Commit identity management for Business OS
 * BOS-27: Distinguish user commits from agent commits
 */

export interface CommitIdentity {
  /** Author name */
  name: string;
  /** Author email */
  email: string;
}

/**
 * Predefined commit identities
 */
export const CommitIdentities = {
  /** User identity (Pete - Phase 0) */
  user: {
    // i18n-exempt -- BOS-104 commit identity constant [ttl=2026-03-31]
    name: "Pete",
    // i18n-exempt -- BOS-104 commit identity constant [ttl=2026-03-31]
    email: "pete@business-os.local",
  } as CommitIdentity,

  /** Agent identity (Claude) */
  agent: {
    // i18n-exempt -- BOS-104 commit identity constant [ttl=2026-03-31]
    name: "Claude Agent",
    // i18n-exempt -- BOS-104 commit identity constant [ttl=2026-03-31]
    email: "agent@business-os.internal",
  } as CommitIdentity,
} as const;

/**
 * Get commit identity for a given actor type
 */
export function getCommitIdentity(
  actor: "user" | "agent" | CommitIdentity
): CommitIdentity {
  if (typeof actor === "object") {
    return actor;
  }
  return CommitIdentities[actor];
}

/**
 * Format commit identity for git commit message Co-Authored-By trailer
 */
export function formatCoAuthor(identity: CommitIdentity): string {
  return `Co-Authored-By: ${identity.name} <${identity.email}>`;
}

/**
 * Get git author options for simple-git commit
 */
export function getGitAuthorOptions(identity: CommitIdentity): {
  "--author": string;
} {
  return {
    "--author": `${identity.name} <${identity.email}>`,
  };
}
