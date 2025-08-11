// packages/ui/src/components/account/Profile.tsx
import { getCustomerSession } from "@auth";
import { getCustomerProfile } from "@acme/platform-core";
import ProfileForm from "./ProfileForm";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export interface ProfilePageProps {
  /** Optional heading to allow shop-specific overrides */
  title?: string;
}

export const metadata = { title: "Profile" };

export default async function ProfilePage({ title = "Profile" }: ProfilePageProps) {
  const session = await getCustomerSession();
  if (!session) return <p>Please log in to view your profile.</p>;

  const csrfToken = randomUUID();
  cookies().set("csrfToken", csrfToken, { sameSite: "strict" });

  const profile = await getCustomerProfile(session.customerId);
  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl">{title}</h1>
      <ProfileForm name={profile?.name} email={profile?.email} />
    </div>
  );
}

