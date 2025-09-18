import { useCallback, useMemo, useState } from "react";

import {
  useInviteUserForm,
  type InviteFormState,
  type InviteUserAction,
} from "./hooks/useInviteUserForm";
import {
  useUserRoleSelections,
  type SaveUserAction,
  type UserTag,
} from "./hooks/useUserRoleSelections";

import type { UserWithRoles } from "@cms/actions/rbac.server";
import type { Role } from "@cms/auth/roles";

import type { ActionResult, ActionStatus } from "../components/actionResult";
import type { RoleDetail } from "../components/roleDetails";

type ToastState = ActionResult & { open: boolean };

const DEFAULT_TOAST: ToastState = { open: false, status: "success", message: "" };

type UseRbacManagementPanelOptions = {
  users: UserWithRoles[];
  roleDetails: Record<Role, RoleDetail>;
  onSaveUser: SaveUserAction;
  onInvite: InviteUserAction;
};

type UseRbacManagementPanelResult = {
  users: UserWithRoles[];
  getSelectedRoles: (userId: string) => Role[];
  getUserTag: (userId: string) => UserTag;
  getHelperText: (userId: string) => string;
  toggleUserRole: (userId: string, role: Role) => void;
  resetUserSelection: (userId: string) => void;
  saveUser: (user: UserWithRoles) => void;
  isUserSaving: (userId: string) => boolean;
  inviteForm: InviteFormState;
  updateInviteField: (field: "name" | "email" | "password", value: string) => void;
  toggleInviteRole: (role: Role) => void;
  resetInviteForm: () => void;
  submitInvite: () => void;
  isInviting: boolean;
  toast: ToastState;
  toastClassName: string;
  closeToast: () => void;
  getInviteHelperText: () => string;
};

function useToastState() {
  const [toast, setToast] = useState<ToastState>(DEFAULT_TOAST);

  const showToast = useCallback((status: ActionStatus, message: string) => {
    setToast({ open: true, status, message });
  }, []);

  const closeToast = useCallback(() => {
    setToast((current) => ({ ...current, open: false }));
  }, []);

  const toastClassName = useMemo(() => {
    return toast.status === "error"
      ? "bg-destructive text-destructive-foreground"
      : "bg-success text-success-fg";
  }, [toast.status]);

  return { toast, toastClassName, showToast, closeToast };
}

export function useRbacManagementPanel({
  users,
  roleDetails,
  onSaveUser,
  onInvite,
}: UseRbacManagementPanelOptions): UseRbacManagementPanelResult {
  const { toast, toastClassName, showToast, closeToast } = useToastState();

  const {
    users: managedUsers,
    getSelectedRoles,
    getUserTag,
    getHelperText,
    toggleUserRole,
    resetUserSelection,
    saveUser,
    isUserSaving,
    syncUser,
  } = useUserRoleSelections({
    users,
    roleDetails,
    onSaveUser,
    showToast,
  });

  const {
    form: inviteForm,
    updateField: updateInviteField,
    toggleRole: toggleInviteRole,
    resetForm: resetInviteForm,
    submit: submitInvite,
    isInviting,
    getHelperText: getInviteHelperText,
  } = useInviteUserForm({
    roleDetails,
    onInvite,
    showToast,
    onInviteSuccess: syncUser,
  });

  return {
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
  };
}

export type { SaveUserAction } from "./hooks/useUserRoleSelections";
export type { InviteUserAction, InviteFormState } from "./hooks/useInviteUserForm";
