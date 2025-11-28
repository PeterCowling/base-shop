// packages/ui/src/components/account/Profile.tsx
import { getCustomerSession, hasPermission } from "@auth";
import { getCustomerProfile } from "@acme/platform-core/customerProfiles";
import ProfileForm from "./ProfileForm";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@acme/i18n/locales";
import type { TranslatableText } from "@acme/types/i18n";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import AccountNavigation from "./AccountNavigation";
import { resolveTranslatableText } from "./translations";
import {
  ACCOUNT_PROFILE_PATH,
  ACCOUNT_ORDERS_PATH,
  ACCOUNT_SESSIONS_PATH,
  ACCOUNT_SHELL_TEST_ID,
  ACCOUNT_CHANGE_PASSWORD_PATH,
} from "./constants";

export interface ProfilePageProps {
  /** Optional heading to allow shop-specific overrides */
  title?: TranslatableText;
  /** Destination to return to after login */
  callbackUrl?: string;
  /** Locale for resolving inline values */
  locale?: Locale;
}

export const metadata = { title: "Profile" };

export default async function ProfilePage({
  title,
  callbackUrl = ACCOUNT_PROFILE_PATH,
  locale = "en",
}: ProfilePageProps) {
  const t = await getServerTranslations(locale);
  const session = await getCustomerSession();
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    return null as never;
  }
  const profile = await getCustomerProfile(session.customerId);
  const canManageProfile = hasPermission(session.role, "manage_profile");
  const navLabel = t("account.navigation.ariaLabel");
  const navItems = [
    { href: ACCOUNT_PROFILE_PATH, label: t("account.profile.title") },
    { href: ACCOUNT_ORDERS_PATH, label: t("account.orders.title") },
    { href: ACCOUNT_SESSIONS_PATH, label: t("account.sessions.title") },
  ];
  const headingId = "account-profile-heading";
  const heading = resolveTranslatableText(t, title, "account.profile.title", locale);

  return (
    <div className="p-6">
      <div className="flex flex-col gap-6 md:flex-row" data-testid={ACCOUNT_SHELL_TEST_ID}>
        <AccountNavigation ariaLabel={navLabel} currentPath={ACCOUNT_PROFILE_PATH} items={navItems} />
        <main
          className="flex-1 rounded border p-4 md:p-6"
          role="main"
          aria-labelledby={headingId}
        >
          <h1 id={headingId} className="mb-4 text-xl">{heading}</h1>
          <ProfileForm name={profile?.name} email={profile?.email} />
          {canManageProfile && (
            <div className="mt-4">
              <Link
                href={ACCOUNT_CHANGE_PASSWORD_PATH}
                className="text-sm underline inline-block min-h-10 min-w-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {t("account.profile.changePassword")}
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
