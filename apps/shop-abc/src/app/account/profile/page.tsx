// apps/shop-abc/src/app/account/profile/page.tsx
import { getCustomerSession } from "@auth";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await getCustomerSession();
  if (!session) return <p>Please log in to view your profile.</p>;
  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl">Profile</h1>
      <pre className="rounded bg-muted p-4">{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}
