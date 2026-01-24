"use client";

import type { UserWithRoles } from "@cms/actions/rbac.server";
import type { Role } from "@cms/auth/roles";

import type { RoleDetail } from "../components/roleDetails";

import InviteUserForm from "./InviteUserForm";
import RbacUserCard from "./RbacUserCard";
import { type InviteUserAction, type SaveUserAction,useRbacManagementPanel } from "./useRbacManagementPanel";

type RbacManagementPanelProps = {
  users: UserWithRoles[];
  roles: Role[];
  roleDetails: Record<Role, RoleDetail>;
  onSaveUser: SaveUserAction;
  onInvite: InviteUserAction;
};

export type { InviteUserAction,SaveUserAction } from "./useRbacManagementPanel";

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
    </div>
  );
}
