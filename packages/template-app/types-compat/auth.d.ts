declare module "@auth" {
  export interface CustomerSession {
    customerId: string;
    role: string;
  }
  export async function getCustomerSession(
    ...args: any[]
  ): Promise<CustomerSession | null>;
  export async function requirePermission(
    ...args: any[]
  ): Promise<CustomerSession>;
}
