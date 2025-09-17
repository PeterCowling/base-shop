// apps/cms/src/app/cms/account-requests/page.tsx

import { approveAccount, listPendingUsers } from "@cms/actions/accounts.server";
import { authOptions } from "@cms/auth/options";
import type { Role } from "@cms/auth/roles";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import AccountRequestsPanel from "./AccountRequestsPanel.client";
import type { ApproveAction } from "./AccountRequestsPanel.client";
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

const approveRequest: ApproveAction = async ({
  id,
  name,
  roles: selectedRoles,
}) => {
  "use server";

  const normalizedName = name.trim() || "The requester";
  const uniqueRoles = Array.from(new Set(selectedRoles));
  if (!id) {
    return {
      status: "error",
      message: "This request could not be processed because it is missing an identifier.",
    } satisfies ActionResult;
  }
  if (uniqueRoles.length === 0) {
    return {
      status: "error",
      message: `Select at least one role before approving ${normalizedName}.`,
    } satisfies ActionResult;
  }

  const formData = new FormData();
  formData.set("id", id);
  uniqueRoles.forEach((role) => formData.append("roles", role));

  try {
    await approveAccount(formData);
    revalidatePath("/cms/account-requests");
    const readableRoles = uniqueRoles.join(", ");
    return {
      status: "success",
      message: `${normalizedName}'s account was approved with ${readableRoles} access.`,
    } satisfies ActionResult;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to approve the account request.";
    return { status: "error", message } satisfies ActionResult;
  }
};

export default async function AccountRequestsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "admin") {
    redirect("/cms");
  }

  const pending = await listPendingUsers();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Account Requests</h2>
      <AccountRequestsPanel
        requests={pending}
        roles={roles}
        roleDetails={ROLE_DETAILS}
        onApprove={approveRequest}
      />
    </div>
  );
}
