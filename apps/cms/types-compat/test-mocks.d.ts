// Types-compat declarations for test mock modules

// next-auth mock functions for tests
declare module "next-auth" {
  export default function NextAuth(options: AuthOptions): any;
  export function __setMockSession(session: any): void;
  export function __resetMockSession(): void;
  export function getServerSession(options?: any): Promise<any>;
  export function signIn(provider?: string, options?: any): Promise<any>;
  export function signOut(options?: any): Promise<any>;
  export const authOptions: any;

  // Auth types
  export interface Account {
    provider: string;
    type: string;
    providerAccountId: string;
    access_token?: string;
    token_type?: string;
    id_token?: string;
    refresh_token?: string;
    scope?: string;
    expires_at?: number;
    session_state?: string;
    [key: string]: any;
  }

  export interface Profile {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    [key: string]: any;
  }

  export interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    [key: string]: any;
  }

  export interface Session {
    user?: User;
    expires: string;
    [key: string]: any;
  }

  export interface AuthOptions {
    providers?: any[];
    callbacks?: {
      signIn?: (params: { user: User; account: Account | null; profile?: Profile; email?: { verificationRequest?: boolean }; credentials?: Record<string, any> }) => boolean | string | Promise<boolean | string>;
      redirect?: (params: { url: string; baseUrl: string }) => string | Promise<string>;
      session?: (params: { session: Session; token: any; user: User }) => Session | Promise<Session>;
      jwt?: (params: { token: any; user?: User; account?: Account | null; profile?: Profile; trigger?: string; isNewUser?: boolean; session?: any }) => any | Promise<any>;
    };
    pages?: {
      signIn?: string;
      signOut?: string;
      error?: string;
      verifyRequest?: string;
      newUser?: string;
    };
    session?: {
      strategy?: "jwt" | "database";
      maxAge?: number;
      updateAge?: number;
    };
    jwt?: {
      secret?: string;
      maxAge?: number;
    };
    secret?: string;
    debug?: boolean;
    [key: string]: any;
  }

  // Type alias for backwards compatibility
  export type NextAuthOptions = AuthOptions;
}

declare module "next-auth/jwt" {
  export function __setMockToken(token: any): void;
  export function __resetMockToken(): void;
  export function getToken(options?: any): Promise<any>;
  export function encode(params: any): Promise<string>;
  export function decode(params: any): Promise<any>;
}

declare module "next-auth/react" {
  export function useSession(): { data: any; status: string };
  export function signIn(provider?: string, options?: any): Promise<any>;
  export function signOut(options?: any): Promise<any>;
  export function getSession(): Promise<any>;
  export const SessionProvider: React.FC<any>;
}

// Local test mock modules
declare module "./media.test.mocks" {
  export const fsMock: any;
  export const writeJsonFileMock: jest.Mock;
  export const sharpMetadataMock: jest.Mock;
  export const ulidMock: jest.Mock;
  export function resetAllMocks(): void;
}

declare module "../media.test.mocks" {
  export const fsMock: any;
  export const writeJsonFileMock: jest.Mock;
  export const sharpMetadataMock: jest.Mock;
  export const ulidMock: jest.Mock;
  export function resetAllMocks(): void;
}

// Test utilities module augmentation
declare module "@acme/test-utils/request" {
  export function jsonRequest(body: any, options?: { url?: string; method?: string; headers?: any; [k: string]: any }): any;
  export function mockFetch(handler?: (url: string, init?: RequestInit) => any): jest.Mock;
}
