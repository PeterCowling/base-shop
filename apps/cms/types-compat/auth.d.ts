// Types-compat declarations for @acme/auth paths

declare module "@acme/auth" {
  export interface Session {
    user?: {
      id: string;
      email?: string;
      name?: string;
      image?: string;
      role?: Role;
      [k: string]: any;
    };
    expires: string;
    [k: string]: any;
  }

  export interface User {
    id: string;
    email?: string;
    name?: string;
    image?: string;
    role?: Role;
    [k: string]: any;
  }

  export type Role = "admin" | "editor" | "viewer" | string;
  export type Permission = string;

  export function getSession(): Promise<Session | null>;
  export function getServerSession(): Promise<Session | null>;
  export function signIn(provider?: string, options?: any): Promise<void>;
  export function signOut(options?: any): Promise<void>;
  export function hasPermission(userOrRole: User | Role | null, permission: string): boolean;
  export function requirePermission(permission: string): (req: any, res: any, next: any) => void;
  export function createCustomerSession(sessionData: { customerId: string; role: string }): Promise<void>;
  export function canWrite(session: Session | null): boolean;
  export function canRead(session: Session | null): boolean;
  export function canAdmin(session: Session | null): boolean;
  export const authOptions: any;
  export const CUSTOMER_SESSION_COOKIE: string;
}

declare module "@acme/auth/types" {
  export interface Session {
    user?: {
      id: string;
      email?: string;
      name?: string;
      image?: string;
      role?: Role;
      [k: string]: any;
    };
    expires: string;
    [k: string]: any;
  }

  export interface User {
    id: string;
    email?: string;
    name?: string;
    image?: string;
    role?: Role;
    [k: string]: any;
  }

  export interface Account {
    provider: string;
    type: string;
    [k: string]: any;
  }

  export interface JWT {
    sub?: string;
    [k: string]: any;
  }

  export type Role = "admin" | "editor" | "viewer" | "ShopAdmin" | "CatalogManager" | "ThemeEditor" | string;
  export type Permission = string;
}

declare module "@acme/auth/*" {
  const content: any;
  export = content;
}

declare module "@acme/auth" {
  export * from "@acme/auth";
}

declare module "@acme/auth/*" {
  const content: any;
  export = content;
}
