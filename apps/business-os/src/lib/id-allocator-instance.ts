/**
 * IDAllocator instance helper
 * MVP-C2: Provides configured IDAllocator instance
 */

import path from "node:path";

import { getRepoRoot } from "./get-repo-root";
import { IDAllocator } from "./repo/IDAllocator";
import { RepoLock } from "./repo/RepoLock";

let allocatorInstance: IDAllocator | null = null;

/**
 * Get singleton IDAllocator instance
 */
export function getIDAllocator(): IDAllocator {
  if (!allocatorInstance) {
    const repoRoot = getRepoRoot();
    const countersFile = path.join(
      repoRoot,
      "docs/business-os/_meta/counters.json"
    );
    const lockDir = path.join(repoRoot, "docs/business-os/.locks");

    const lock = new RepoLock(lockDir);
    allocatorInstance = new IDAllocator(countersFile, lock);
  }

  return allocatorInstance;
}

/**
 * Allocate next card ID
 * @param business Business ID (e.g., "BRIK")
 * @returns Card ID (e.g., "BRIK-001")
 */
export async function allocateCardId(business: string): Promise<string> {
  const allocator = getIDAllocator();
  return allocator.allocate(business, "card");
}

/**
 * Allocate next idea ID
 * @param business Business ID (e.g., "BRIK")
 * @returns Idea ID (e.g., "BRIK-OPP-001")
 */
export async function allocateIdeaId(business: string): Promise<string> {
  const allocator = getIDAllocator();
  return allocator.allocate(business, "idea");
}
