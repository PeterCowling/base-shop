import type { CustomerProfile } from "@acme/types";

export async function getCustomerProfile(
  customerId?: string
): Promise<CustomerProfile | null> {
  void customerId;
  return null;
}
