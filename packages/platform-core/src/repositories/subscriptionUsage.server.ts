// packages/platform-core/src/repositories/subscriptionUsage.server.ts
import "server-only";

// Re-export shipment usage helpers
export * from "../subscriptionUsage";

// In-memory stores for demo purposes. In a production system these values
// would be persisted to the database.
const swapCounts = new Map<string, number>();
const userPlans = new Map<string, string>();

/**
 * Record the subscription plan selected by a user.
 */
export async function setUserPlan(
  shop: string,
  customerId: string,
  planId: string,
): Promise<void> {
  userPlans.set(`${shop}:${customerId}`, planId);
}

/**
 * Retrieve the subscription plan currently selected by a user.
 */
export async function getUserPlan(
  shop: string,
  customerId: string,
): Promise<string | undefined> {
  return userPlans.get(`${shop}:${customerId}`);
}

/**
 * Increment the number of swaps a user has performed in a given month.
 */
export async function incrementSwapCount(
  shop: string,
  customerId: string,
  month: string,
  count = 1,
): Promise<void> {
  const key = `${shop}:${customerId}:${month}`;
  swapCounts.set(key, (swapCounts.get(key) ?? 0) + count);
}

/**
 * Calculate the remaining number of swaps a user may perform for the month.
 */
export async function getRemainingSwaps(
  shop: string,
  customerId: string,
  month: string,
  swapLimit: number,
): Promise<number> {
  const key = `${shop}:${customerId}:${month}`;
  const used = swapCounts.get(key) ?? 0;
  return Math.max(0, swapLimit - used);
}

