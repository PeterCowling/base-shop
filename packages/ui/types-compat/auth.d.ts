declare module "@acme/auth" {
  export type SessionRecord = {
    id?: string;
    device?: string;
    ip?: string;
    // Make dates available as Date to satisfy .toISOString() calls.
    createdAt: Date;
    lastActiveAt?: Date;
    [k: string]: any;
  };
  export async function getCustomerSession(...args: any[]): Promise<any>;
  // Allow boolean OR Promise<boolean> so callers can use it without await.
  export function hasPermission(...args: any[]): boolean | Promise<boolean>;
  export async function listSessions(...args: any[]): Promise<SessionRecord[]>;
  export async function revokeSession(...args: any[]): Promise<void>;
}
