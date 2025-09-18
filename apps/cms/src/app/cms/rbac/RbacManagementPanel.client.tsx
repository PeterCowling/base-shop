"use client";

import { Toast } from "@/components/atoms";
import { useRbacManagementPanel, type InviteUserAction, type SaveUserAction } from "./useRbacManagementPanel";
import InviteUserForm from "./InviteUserForm";
import RbacUserCard from "./RbacUserCard";

import type { UserWithRoles } from "@cms/actions/rbac.server";
import type { Role } from "@cms/auth/roles";

import type { RoleDetail } from "../components/roleDetails";

type RbacManagementPanelProps = {
  users: UserWithRoles[];
  roles: Role[];
  roleDetails: Record<Role, RoleDetail>;
  onSaveUser: SaveUserAction;
  onInvite: InviteUserAction;
};

export type { SaveUserAction, InviteUserAction } from "./useRbacManagementPanel";

export default function RbacManagementPanel({
  users,
  roles,
  roleDetails,
  onSaveUser,
  onInvite,
}: RbacManagementPanelProps) {
  const {
    users: managedUsers,
    getSelectedRoles,
    getUserTag,
    getHelperText,
    toggleUserRole,
    resetUserSelection,
    saveUser,
    isUserSaving,
    inviteForm,
    updateInviteField,
    toggleInviteRole,
    resetInviteForm,
    submitInvite,
    isInviting,
    toast,
    toastClassName,
    closeToast,
    getInviteHelperText,
  } = useRbacManagementPanel({
    users,
    roleDetails,
    onSaveUser,
    onInvite,
  });

  return (
    <div className="space-y-6">
      {managedUsers.map((user) => (
        <RbacUserCard
          key={user.id}
          user={user}
          roles={roles}
          roleDetails={roleDetails}
          selectedRoles={getSelectedRoles(user.id)}
          statusTag={getUserTag(user.id)}
          helperText={getHelperText(user.id)}
          onToggleRole={(role) => toggleUserRole(user.id, role)}
          onSave={() => saveUser(user)}
          onReset={() => resetUserSelection(user.id)}
          disabled={isUserSaving(user.id)}
        />
      ))}

      <InviteUserForm
        roles={roles}
        roleDetails={roleDetails}
        form={inviteForm}
        helperText={getInviteHelperText()}
        isInviting={isInviting}
        onFieldChange={updateInviteField}
        onToggleRole={toggleInviteRole}
        onSubmit={submitInvite}
        onReset={resetInviteForm}
      />

      <Toast
        open={toast.open}
        message={toast.message}
        className={toastClassName}
        onClose={closeToast}
        role="status"
      />
    </div>
  );
}
