// packages/ui/src/components/account/Profile.tsx
import { getCustomerSession, hasPermission } from "@auth";
import { getCustomerProfile } from "@acme/platform-core/customerProfiles";
import ProfileForm from "./ProfileForm";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@acme/i18n/locales";
import type { TranslatableText } from "@acme/types/i18n";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";

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
  callbackUrl = "/account/profile",
  locale = "en",
}: ProfilePageProps) {
  const t = await getServerTranslations(locale);
  const tf = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const session = await getCustomerSession();
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    return null as never;
  }
  const profile = await getCustomerProfile(session.customerId);
  const canManageProfile = hasPermission(session.role, "manage_profile");
  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl">{title ? (typeof title === "string" ? title : title.type === "key" ? t(title.key) : ((title.value as Partial<Record<Locale, string>>)?.[locale] ?? tf("account.profile.title", "Profile"))) : tf("account.profile.title", "Profile")}</h1>
      <ProfileForm name={profile?.name} email={profile?.email} />
      {canManageProfile && (
        <div className="mt-4">
          <Link href="/account/change-password" className="text-sm underline inline-block min-h-10 min-w-10">
            {/* i18n-exempt */}
            {t("Change password")}
          </Link>
        </div>
      )}
    </div>
  );
}
