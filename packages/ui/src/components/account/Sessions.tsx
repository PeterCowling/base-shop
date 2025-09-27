// packages/ui/src/components/account/Sessions.tsx
import { type SessionRecord } from "@auth";
import { redirect } from "next/navigation";
import type { Locale } from "@acme/i18n/locales";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import RevokeSessionButton from "./RevokeSessionButton";
import { revoke } from "../../actions/revokeSession";

export { revoke };

export interface SessionsPageProps {
  /** Optional heading override */
  title?: string;
  /** Destination to return to after login */
  callbackUrl?: string;
}

// i18n-exempt — static metadata; app-level routes localize this
export const metadata = { title: "Sessions" };

export default async function SessionsPage({
  title,
  callbackUrl = "/account/sessions",
}: SessionsPageProps = {}) {
  const { getCustomerSession, listSessions, hasPermission } = await import("@auth");
  const t = await getServerTranslations("en" as Locale);
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
              <div className="text-sm text-muted" data-token="--color-muted"> {/* i18n-exempt — formatted timestamp */}
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
