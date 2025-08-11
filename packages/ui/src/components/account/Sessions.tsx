// packages/ui/src/components/account/Sessions.tsx
import { getCustomerSession, listSessions, revokeSession } from "@auth";
import { revalidatePath } from "next/cache";

export interface SessionsPageProps {
  /** Optional heading override */
  title?: string;
}

export const metadata = { title: "Sessions" };

export async function revoke(id: string) {
  "use server";
  await revokeSession(id);
  revalidatePath("/account/sessions");
}

export default async function SessionsPage({ title = "Sessions" }: SessionsPageProps = {}) {
  const session = await getCustomerSession();
  if (!session) return <p>Please log in to view your sessions.</p>;
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
            <form action={revoke.bind(null, s.sessionId)}>
              <button type="submit" className="rounded bg-primary px-4 py-2 text-primary-fg">
                Revoke
              </button>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}

