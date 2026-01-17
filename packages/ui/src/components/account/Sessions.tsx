// packages/ui/src/components/account/Sessions.tsx
import { type SessionRecord } from "@acme/auth";
import { redirect } from "next/navigation";
import type { Locale } from "@acme/i18n/locales";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import RevokeSessionButton from "./RevokeSessionButton";
import { revoke } from "../../actions/revokeSession";
import AccountNavigation from "./AccountNavigation";
import type { ReactNode } from "react";
import { resolveTranslatableText } from "./translations";
import {
  ACCOUNT_PROFILE_PATH,
  ACCOUNT_ORDERS_PATH,
  ACCOUNT_SESSIONS_PATH,
  ACCOUNT_SHELL_TEST_ID,
} from "./constants";

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
  callbackUrl = ACCOUNT_SESSIONS_PATH,
  locale = "en",
}: SessionsPageProps = {}) {
  const { getCustomerSession, listSessions, hasPermission } = await import("@acme/auth");
  const t = await getServerTranslations(locale as Locale);
  const session = await getCustomerSession();
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    return null as never;
  }
  const navLabel = t("account.navigation.ariaLabel");
  const navItems = [
    { href: ACCOUNT_PROFILE_PATH, label: t("account.profile.title") },
    { href: ACCOUNT_ORDERS_PATH, label: t("account.orders.title") },
    { href: ACCOUNT_SESSIONS_PATH, label: t("account.sessions.title") },
  ];
  const headingId = "account-sessions-heading";
  const heading = resolveTranslatableText(t, title, "account.sessions.title", locale as Locale);

  const canManageSessions = hasPermission(session.role, "manage_sessions");
  let body: ReactNode;

  if (!canManageSessions) {
    body = <p>{t("account.sessions.notAuthorized")}</p>;
  } else {
    const sessions: SessionRecord[] = await listSessions(session.customerId);
    if (!sessions.length) {
      body = <p>{t("account.sessions.empty")}</p>;
    } else {
      body = (
        <ul className="space-y-2">
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
      );
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col gap-6 md:flex-row" data-testid={ACCOUNT_SHELL_TEST_ID}>
        <AccountNavigation ariaLabel={navLabel} currentPath={ACCOUNT_SESSIONS_PATH} items={navItems} />
        <main
          className="flex-1 rounded border p-4 md:p-6"
          role="main"
          aria-labelledby={headingId}
        >
          <h1 id={headingId} className="mb-4 text-xl">
            {heading}
          </h1>
          {body}
        </main>
      </div>
    </div>
  );
}
