import { Button } from "@/components/ui/button";
import { approveAccount, listPendingUsers } from "@cms/actions/accounts";
import { authOptions } from "@cms/auth/options";
import type { Role } from "@cms/auth/roles";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function AccountRequestsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "admin") {
    redirect("/cms");
  }

  const pending = listPendingUsers();

  async function approve(formData: FormData) {
    "use server";
    await approveAccount(formData);
  }

  const roles: Role[] = [
    "admin",
    "viewer",
    "ShopAdmin",
    "CatalogManager",
    "ThemeEditor",
  ];

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Account Requests</h2>
      {pending.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        pending.map((r) => (
          <form key={r.id} action={approve} className="mb-4 rounded border p-3">
            <input type="hidden" name="id" value={r.id} />
            <p>
              <b>{r.name}</b> ({r.email})
            </p>
            <div className="my-2 flex flex-wrap gap-2">
              {roles.map((role) => (
                <label key={role} className="flex items-center gap-1 text-sm">
                  <input type="checkbox" name="roles" value={role} />
                  {role}
                </label>
              ))}
            </div>
            <Button type="submit">Approve</Button>
          </form>
        ))
      )}
    </div>
  );
}
