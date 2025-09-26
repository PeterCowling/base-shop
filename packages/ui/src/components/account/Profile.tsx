// packages/ui/src/components/account/Profile.tsx
import { getCustomerSession, hasPermission } from "@auth";
import { getCustomerProfile } from "@acme/platform-core/customerProfiles";
import ProfileForm from "./ProfileForm";
import { redirect } from "next/navigation";
import Link from "next/link";
const t = (s: string) => s;

export interface ProfilePageProps {
  /** Optional heading to allow shop-specific overrides */
  title?: string;
  /** Destination to return to after login */
  callbackUrl?: string;
}

export const metadata = { title: t("Profile") };

export default async function ProfilePage({
  title,
  callbackUrl = "/account/profile",
}: ProfilePageProps) {
  const session = await getCustomerSession();
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    return null as never;
  }
  const profile = await getCustomerProfile(session.customerId);
  const canManageProfile = hasPermission(session.role, "manage_profile");
  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl">{title ?? t("Profile")}</h1>
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
