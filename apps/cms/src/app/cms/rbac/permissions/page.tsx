// apps/cms/src/app/cms/rbac/permissions/page.tsx
import { Button } from "@/components/atoms/shadcn";
import { updateRolePermissions } from "@cms/actions/rbac.server";
import { authOptions } from "@cms/auth/options";
import type { Role } from "@cms/auth/roles";
import type { Permission } from "@auth";
import { PERMISSIONS } from "@auth/types/permissions";
import { readRbac } from "@cms/lib/server/rbacStore";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function PermissionsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "admin") {
    redirect("/cms");
  }

  const db = await readRbac();

  async function save(formData: FormData) {
    "use server";
    await updateRolePermissions(formData);
  }

  const roles: Role[] = [
    "admin",
    "viewer",
    "customer",
    "ShopAdmin",
    "CatalogManager",
    "ThemeEditor",
  ];

  const permissions: Permission[] = PERMISSIONS;

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Role Permissions</h2>
      {roles.map((role) => (
        <form key={role} action={save} className="mb-4 rounded border border-border/10 p-3">
          <input type="hidden" name="role" value={role} />
          <p className="font-semibold">{role}</p>
          <div className="my-2 flex flex-wrap gap-2">
            {permissions.map((perm) => (
              <label key={perm} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  name="permissions"
                  value={perm}
                  defaultChecked={db.permissions[role]?.includes(perm)}
                />
                {perm}
              </label>
            ))}
          </div>
          <Button type="submit">Save</Button>
        </form>
      ))}
    </div>
  );
}
