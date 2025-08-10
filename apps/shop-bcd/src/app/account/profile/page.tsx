// apps/shop-bcd/src/app/account/profile/page.tsx
import { getCustomerSession } from "@auth";
import { profileGet } from "@platform-core/profile";
import shop from "../../../../shop.json";
import ProfileForm from "./ProfileForm";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await getCustomerSession();
  if (!session) return <p>Please log in to view your profile.</p>;
  const profile = await profileGet(shop.id, session.customerId);
  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl">Profile</h1>
      <ProfileForm name={profile.name} email={profile.email} />
    </div>
  );
}
