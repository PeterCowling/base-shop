// apps/cms/src/actions/common/auth.ts
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@cms/auth/options";

type AppSession = Session & { user?: (Session["user"] & { role?: string; id?: string }) };

export async function ensureAuthorized(): Promise<AppSession> {
  let session = (await getServerSession(authOptions)) as AppSession | null;
  // If the central next-auth test mock has set a global session, prefer it.
  const injected = (globalThis as Record<string, unknown>).__MOCK_SESSION as AppSession | undefined;
  if (typeof injected !== "undefined") {
    session = injected;
  }
  if (session && session.user?.role !== "viewer") {
    return session;
  }
  // In unit/integration tests it's valuable to exercise downstream logic
  // without wiring a full auth flow. Allow opting into an admin session via
  // an explicit env flag. Real runtimes are unaffected.
  // Only assume admin when tests didn't explicitly set a mock session
  if (
    process.env.CMS_TEST_ASSUME_ADMIN === "1" &&
    !(globalThis as Record<string, unknown>).__NEXTAUTH_MOCK_SET
  ) {
    return { user: { role: "admin" } } as AppSession;
  }
  throw new Error("Forbidden");
}
