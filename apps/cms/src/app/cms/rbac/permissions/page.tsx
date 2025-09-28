// apps/cms/src/app/cms/rbac/permissions/page.tsx
import { Button } from "@/components/atoms/shadcn";
import { Inline } from "@ui/components/atoms/primitives";
import { updateRolePermissions } from "@cms/actions/rbac.server";
import { authOptions } from "@cms/auth/options";
import type { Role } from "@cms/auth/roles";
import type { Permission } from "@auth";
import { PERMISSIONS } from "@auth/types/permissions";
import { readRbac } from "@cms/lib/server/rbacStore";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";

export const revalidate = 0;

export default async function PermissionsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "admin") {
    redirect("/cms");
  }

  const db = await readRbac();
  const t = await getTranslations("en");

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
      <h2 className="mb-4 text-xl font-semibold">{t("cms.rbac.permissions.title")}</h2>
      {roles.map((role) => (
        <form key={role} action={save} className="mb-4 rounded border border-border/10 p-3">
          <input type="hidden" name="role" value={role} />
          <p className="font-semibold">{role}</p>
          <Inline className="my-2" gap={2} wrap>
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
          </Inline>
          <Button type="submit">{t("actions.save")}</Button>
        </form>
      ))}
    </div>
  );
}
