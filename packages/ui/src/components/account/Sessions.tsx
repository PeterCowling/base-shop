// packages/ui/src/components/account/Sessions.tsx
import { type SessionRecord } from "@auth";
import { redirect } from "next/navigation";
import type { Locale } from "@acme/i18n/locales";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import RevokeSessionButton from "./RevokeSessionButton";
import { revoke } from "../../actions/revokeSession";

export { revoke };

export interface SessionsPageProps {
  /** Optional heading override i18n-exempt -- DOCS-0001 [ttl=2026-01-31] */
  title?: import("@acme/types/i18n").TranslatableText;
  /** Destination to return to after login i18n-exempt -- DOCS-0001 [ttl=2026-01-31] */
  callbackUrl?: string;
  /** Locale for resolving inline values i18n-exempt -- DOCS-0001 [ttl=2026-01-31] */
  locale?: Locale;
}

// i18n-exempt -- ABC-123 [ttl=2026-01-31] APP-ROUTES static metadata; app-level routes localize this
export const metadata = { title: "Sessions" };

export default async function SessionsPage({
  title,
  callbackUrl = "/account/sessions",
  locale = "en",
}: SessionsPageProps = {}) {
  const { getCustomerSession, listSessions, hasPermission } = await import("@auth");
  const t = await getServerTranslations(locale as Locale);
  const session = await getCustomerSession();
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    return null as never;
  }
  if (!hasPermission(session.role, "manage_sessions")) {
    return <p className="p-6">{t("account.sessions.notAuthorized")}</p>;
  }
  const sessions: SessionRecord[] = await listSessions(session.customerId);
  if (!sessions.length) return <p className="p-6">{t("account.sessions.empty")}</p>;
  return (
    <>
      <h1 className="p-6 text-xl">
        {
          title
            ? (typeof title === "string"
                ? title
                : title.type === "key"
                  ? t(title.key)
                  : ((title.value as Partial<Record<Locale, string>>)?.[locale] ?? t("account.sessions.title")))
            : t("account.sessions.title")
        }
      </h1>
      <ul className="space-y-2 p-6">
        {sessions.map((s) => (
          <li key={s.sessionId} className="flex items-center justify-between rounded border p-4">
            <div>
              <div>{s.userAgent}</div>
              <div className="text-sm text-muted" data-token="--color-muted"> {/* i18n-exempt -- DEV-000 formatted timestamp */}
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
