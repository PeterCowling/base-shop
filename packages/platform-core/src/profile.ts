// packages/platform-core/src/profile.ts
// Helper to fetch a customer's profile. Currently returns placeholder values.
import "server-only";

export interface CustomerProfile {
  name?: string;
  email?: string;
}

// TODO: integrate with persistent profile storage
export async function profileGet(
  _shop: string,
  _customerId: string
): Promise<CustomerProfile> {
  return { name: undefined, email: undefined };
}
