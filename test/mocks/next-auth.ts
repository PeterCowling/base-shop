// Central NextAuth mock used across tests
// Provides a stable, overridable getServerSession()
export type TestUser = {
  id?: string;
  email?: string;
  role?: string;
  name?: string;
} & Record<string, unknown>;

export type TestSession = {
  user: TestUser;
  expires?: string;
} | null;

let currentSession: TestSession = null;

// Allow tests to control the mocked session
export function __setMockSession(session: TestSession): void {
  currentSession = session ?? null;
}

export function __resetMockSession(): void {
  currentSession = null;
}

// Match next-auth server API used in the codebase
export async function getServerSession(..._args: unknown[]): Promise<TestSession> {
  return currentSession;
}

export default {} as unknown as never;

