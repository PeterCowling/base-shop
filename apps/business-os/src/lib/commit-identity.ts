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
    name: "Pete",
    email: "pete@business-os.local",
  } as CommitIdentity,

  /** Agent identity (Claude) */
  agent: {
    name: "Claude Agent",
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
