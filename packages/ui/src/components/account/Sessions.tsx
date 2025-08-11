// packages/ui/src/components/account/Sessions.tsx
import { revokeSession } from "@auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import RevokeSessionButton from "./RevokeSessionButton";

export interface SessionsPageProps {
  /** Optional heading override */
  title?: string;
  /** Destination to return to after login */
  callbackUrl?: string;
}

export const metadata = { title: "Sessions" };

export async function revoke(id: string) {
  "use server";
  const { getCustomerSession, listSessions } = await import("@auth");
  try {
    const session = await getCustomerSession();
    if (!session) {
      return { success: false, error: "Failed to revoke session." };
    }
    const sessions = await listSessions(session.customerId);
    if (!sessions.some((s) => s.sessionId === id)) {
      return { success: false, error: "Session does not belong to the user." };
    }
    await revokeSession(id);
    revalidatePath("/account/sessions");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to revoke session." };
  }
}

export default async function SessionsPage({
  title = "Sessions",
  callbackUrl = "/account/sessions",
}: SessionsPageProps = {}) {
  const { getCustomerSession, listSessions } = await import("@auth");
  const session = await getCustomerSession();
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    return null as never;
  }
  const sessions = await listSessions(session.customerId);
  if (!sessions.length) return <p className="p-6">No active sessions.</p>;
  return (
    <>
      <h1 className="p-6 text-xl">{title}</h1>
      <ul className="space-y-2 p-6">
        {sessions.map((s) => (
          <li key={s.sessionId} className="flex items-center justify-between rounded border p-4">
            <div>
              <div>{s.userAgent}</div>
              <div className="text-sm text-gray-500">{s.createdAt.toISOString()}</div>
            </div>
            <RevokeSessionButton sessionId={s.sessionId} />
          </li>
        ))}
      </ul>
    </>
  );
}

