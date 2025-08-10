// packages/lib/src/customerProfile.ts

export type CustomerProfile = {
  name: string;
  email: string;
};

/**
 * Fetch the profile for a given customer.
 * Placeholder implementation.
 */
export async function getCustomerProfile(
  customerId: string
): Promise<CustomerProfile | null> {
  void customerId;
  // TODO: replace with real profile lookup
  return null;
}

