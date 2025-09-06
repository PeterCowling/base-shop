import type { CustomerProfile } from "@acme/types";

export declare function getCustomerProfile(customerId: string): Promise<CustomerProfile>;
export declare function updateCustomerProfile(
  customerId: string,
  data: { name: string; email: string }
): Promise<CustomerProfile>;
