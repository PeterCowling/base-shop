// packages/ui/src/components/account/Profile.tsx
import { getCustomerSession } from "@auth";
import ProfileForm from "./ProfileForm";

export interface ProfilePageProps {
  /** Optional heading to allow shop-specific overrides */
  title?: string;
}

export const metadata = { title: "Profile" };

export default async function ProfilePage({ title = "Profile" }: ProfilePageProps) {
  const session = await getCustomerSession();
  if (!session) return <p>Please log in to view your profile.</p>;
  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl">{title}</h1>
      <ProfileForm />
    </div>
  );
}

