import type { CustomerSession } from "@acme/auth";

declare module "@auth" {
  export async function getCustomerSession(
    ...args: any[]
  ): Promise<CustomerSession | null>;
  export async function requirePermission(
    ...args: any[]
  ): Promise<CustomerSession>;
}
