declare module "@auth" {
  export async function getCustomerSession(...args: any[]): Promise<any>;
  export async function requirePermission(...args: any[]): Promise<void>;
}
