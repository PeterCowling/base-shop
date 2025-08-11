// packages/ui/src/components/account/Profile.tsx
import { getCustomerSession } from "@auth";
import { getCustomerProfile } from "@acme/platform-core";
import ProfileForm from "./ProfileForm";
import { redirect } from "next/navigation";
import Link from "next/link";

export interface ProfilePageProps {
  /** Optional heading to allow shop-specific overrides */
  title?: string;
  /** Destination to return to after login */
  callbackUrl?: string;
}

export const metadata = { title: "Profile" };

export default async function ProfilePage({
  title = "Profile",
  callbackUrl = "/account/profile",
}: ProfilePageProps) {
  const session = await getCustomerSession();
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    return null as never;
  }
  const profile = await getCustomerProfile(session.customerId);
  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl">{title}</h1>
      <ProfileForm name={profile?.name} email={profile?.email} />
      <div className="mt-4">
        <Link href="/account/change-password" className="text-sm underline">
          Change password
        </Link>
      </div>
    </div>
  );
}

