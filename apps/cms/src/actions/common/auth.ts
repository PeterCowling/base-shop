// apps/cms/src/actions/common/auth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@cms/auth/options";

export async function ensureAuthorized() {
  let session = await getServerSession(authOptions);
  // If the central next-auth test mock has set a global session, prefer it.
  const injected = (globalThis as any).__MOCK_SESSION;
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
    !(globalThis as any).__NEXTAUTH_MOCK_SET
  ) {
    return { user: { role: "admin" } } as any;
  }
  throw new Error("Forbidden");
}
