import "server-only";

export interface CustomerProfile {
  name: string;
  email: string;
}

export async function updateCustomerProfile(
  customerId: string,
  profile: CustomerProfile
): Promise<void> {
  // TODO: implement persistence with database
}

