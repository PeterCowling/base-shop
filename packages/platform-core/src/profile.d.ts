import type { CustomerProfile } from "@acme/types";

export declare function getCustomerProfile(
  customerId?: string
): Promise<CustomerProfile | null>;
