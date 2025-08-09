// apps/cms/src/app/cms/rbac/page.tsx
import { Button, Input } from "@ui";
import {
  inviteUser,
  listUsers,
  updateUserRoles,
} from "@cms/actions/rbac.server";
import { authOptions } from "@cms/auth/options";
import type { Role } from "@cms/auth/roles";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function RbacPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "admin") {
    redirect("/cms");
  }

  const users = await listUsers();

  async function save(formData: FormData) {
    "use server";
    await updateUserRoles(formData);
  }

  async function invite(formData: FormData) {
    "use server";
    await inviteUser(formData);
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
      <h2 className="mb-4 text-xl font-semibold">User Roles</h2>
      {users.map((u) => (
        <form key={u.id} action={save} className="mb-4 rounded border p-3">
          <input type="hidden" name="id" value={u.id} />
          <p>
            <b>{u.name}</b> ({u.email})
          </p>
          <div className="my-2 flex flex-wrap gap-2">
            {roles.map((role) => (
              <label key={role} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  name="roles"
                  value={role}
                  defaultChecked={
                    Array.isArray(u.roles)
                      ? u.roles.includes(role)
                      : u.roles === role
                  }
                />
                {role}
              </label>
            ))}
          </div>
          <Button type="submit">Save</Button>
        </form>
      ))}

      <h3 className="mt-8 text-lg font-semibold">Invite User</h3>
      <form action={invite} className="mt-2 space-y-2 rounded border p-3">
        <label className="block text-sm">
          <span>Name</span>
          <Input name="name" className="mt-1" />
        </label>
        <label className="block text-sm">
          <span>Email</span>
          <Input type="email" name="email" className="mt-1" />
        </label>
        <label className="block text-sm">
          <span>Password</span>
          <Input type="password" name="password" className="mt-1" />
        </label>
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <label key={role} className="flex items-center gap-1 text-sm">
              <input type="checkbox" name="roles" value={role} /> {role}
            </label>
          ))}
        </div>
        <Button type="submit">Invite</Button>
      </form>
    </div>
  );
}
