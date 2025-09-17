// apps/cms/src/app/cms/rbac/page.tsx

import {
  inviteUser,
  listUsers,
  updateUserRoles,
} from "@cms/actions/rbac.server";
import type { UserWithRoles } from "@cms/actions/rbac.server";
import { authOptions } from "@cms/auth/options";
import type { Role } from "@cms/auth/roles";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import RbacManagementPanel from "./RbacManagementPanel.client";
import type {
  InviteUserAction,
  SaveUserAction,
} from "./RbacManagementPanel.client";
import type { ActionResult } from "../components/actionResult";
import { ROLE_DETAILS } from "../components/roleDetails";

export const revalidate = 0;

const roles: Role[] = [
  "admin",
  "viewer",
  "ShopAdmin",
  "CatalogManager",
  "ThemeEditor",
];

const saveUserRoles: SaveUserAction = async ({ id, roles: selectedRoles }) => {
  "use server";

  const uniqueRoles = Array.from(new Set(selectedRoles));
  if (!id) {
    return {
      status: "error",
      message: "Unable to update roles because the user identifier is missing.",
    } satisfies ActionResult;
  }
  if (uniqueRoles.length === 0) {
    return {
      status: "error",
      message: "Assign at least one role before saving changes.",
    } satisfies ActionResult;
  }

  const formData = new FormData();
  formData.set("id", id);
  uniqueRoles.forEach((role) => formData.append("roles", role));

  try {
    await updateUserRoles(formData);
    revalidatePath("/cms/rbac");
    return {
      status: "success",
      message: "Roles updated successfully.",
    } satisfies ActionResult;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update user roles.";
    return { status: "error", message } satisfies ActionResult;
  }
};

const inviteUserAction: InviteUserAction = async ({
  name,
  email,
  password,
  roles: selectedRoles,
}) => {
  "use server";

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const uniqueRoles = Array.from(new Set(selectedRoles));

  const issues: string[] = [];
  if (!trimmedName) issues.push("Enter a name.");
  if (!trimmedEmail) issues.push("Provide an email address.");
  if (!password) issues.push("Set a temporary password.");
  if (uniqueRoles.length === 0) issues.push("Assign at least one role.");

  const existing = await listUsers();
  if (trimmedEmail && existing.some((user) => user.email === trimmedEmail)) {
    issues.push("That email is already associated with another user.");
  }

  if (issues.length > 0) {
    return { status: "error", message: issues.join(" ") } satisfies ActionResult;
  }

  const formData = new FormData();
  formData.set("name", trimmedName);
  formData.set("email", trimmedEmail);
  formData.set("password", password);
  uniqueRoles.forEach((role) => formData.append("roles", role));

  try {
    await inviteUser(formData);
    revalidatePath("/cms/rbac");
    const refreshed = await listUsers();
    const invitedUser = refreshed.find((user) => user.email === trimmedEmail);
    return {
      status: "success",
      message: `${trimmedName} has been invited to the CMS.`,
      user: invitedUser as UserWithRoles | undefined,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to send the invitation.";
    return { status: "error", message } satisfies ActionResult;
  }
};

export default async function RbacPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "admin") {
    redirect("/cms");
  }

  const users = await listUsers();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">User Roles</h2>
        <p className="text-sm text-muted-foreground">
          See the
          <Link
            href="/docs/permissions.md"
            target="_blank"
            rel="noreferrer"
            className="ml-1 underline"
          >
            permission guide
          </Link>
          for default role mappings and examples.
        </p>
      </div>
      <RbacManagementPanel
        users={users}
        roles={roles}
        roleDetails={ROLE_DETAILS}
        onSaveUser={saveUserRoles}
        onInvite={inviteUserAction}
      />
    </div>
  );
}
