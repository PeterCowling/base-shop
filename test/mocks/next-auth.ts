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
  (globalThis as any).__NEXTAUTH_MOCK_SET = true;
  (globalThis as any).__MOCK_SESSION = currentSession;
}

export function __resetMockSession(): void {
  currentSession = null;
  (globalThis as any).__NEXTAUTH_MOCK_SET = false;
  (globalThis as any).__MOCK_SESSION = undefined;
}

// Match next-auth server API used in the codebase
export const getServerSession = (jest.fn(
  async (..._args: unknown[]): Promise<TestSession> => currentSession,
) as unknown) as jest.MockedFunction<(
  ...args: unknown[]
) => Promise<TestSession>>;

export default {} as unknown as never;
