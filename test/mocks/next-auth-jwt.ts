// Central mock for next-auth/jwt to avoid pulling ESM jose in Jest
export type TestJWT = {
  email?: string;
  sub?: string;
  role?: string;
  [key: string]: unknown;
} | null;

let currentToken: TestJWT = null;

export function __setMockToken(token: TestJWT): void {
  currentToken = token ?? null;
}

export function __resetMockToken(): void {
  currentToken = null;
}

export async function getToken(..._args: unknown[]): Promise<TestJWT> {
  return currentToken;
}

export default {} as unknown as never;

