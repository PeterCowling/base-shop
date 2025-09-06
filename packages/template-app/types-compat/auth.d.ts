declare module "@auth" {
  import type { CustomerSession } from "@acme/auth";

  export type { CustomerSession };

  export function getCustomerSession(
    ...args: any[]
  ): Promise<CustomerSession | null>;

  export function requirePermission(
    ...args: any[]
  ): Promise<CustomerSession>;
}
