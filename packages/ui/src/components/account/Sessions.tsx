// packages/ui/src/components/account/Sessions.tsx
import { type SessionRecord } from "@auth";
import { redirect } from "next/navigation";
const t = (s: string) => s;
import RevokeSessionButton from "./RevokeSessionButton";
import { revoke } from "../../actions/revokeSession";

export { revoke };

export interface SessionsPageProps {
  /** Optional heading override */
  title?: string;
  /** Destination to return to after login */
  callbackUrl?: string;
}

export const metadata = { title: t("Sessions") };

export default async function SessionsPage({
  title,
  callbackUrl = "/account/sessions",
}: SessionsPageProps = {}) {
  const { getCustomerSession, listSessions, hasPermission } = await import("@auth");
  const session = await getCustomerSession();
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    return null as never;
  }
  if (!hasPermission(session.role, "manage_sessions")) {
    return <p className="p-6">{t("Not authorized.")}</p>;
  }
  const sessions: SessionRecord[] = await listSessions(session.customerId);
  if (!sessions.length) return <p className="p-6">{t("No active sessions.")}</p>;
  return (
    <>
      <h1 className="p-6 text-xl">{title ?? t("Sessions")}</h1>
      <ul className="space-y-2 p-6">
        {sessions.map((s) => (
          <li key={s.sessionId} className="flex items-center justify-between rounded border p-4">
            <div>
              <div>{s.userAgent}</div>
              <div className="text-sm text-muted" data-token="--color-muted">
                {s.createdAt.toISOString()}
              </div>
            </div>
            <RevokeSessionButton revoke={revoke} sessionId={s.sessionId} />
          </li>
        ))}
      </ul>
    </>
  );
}
