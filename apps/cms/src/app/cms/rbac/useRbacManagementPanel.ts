import { useCallback, useMemo, useState, useTransition } from "react";

import type { UserWithRoles } from "@cms/actions/rbac.server";
import type { Role } from "@cms/auth/roles";

import type { ActionResult, ActionStatus } from "../components/actionResult";
import type { RoleDetail } from "../components/roleDetails";

type SavePayload = {
  id: string;
  roles: Role[];
};

type InvitePayload = {
  name: string;
  email: string;
  password: string;
  roles: Role[];
};

export type SaveUserAction = (payload: SavePayload) => Promise<ActionResult>;
export type InviteUserAction = (
  payload: InvitePayload
) => Promise<ActionResult & { user?: UserWithRoles }>;

type ToastState = ActionResult & { open: boolean };

type SelectionState = Record<string, Role[]>;

export type InviteFormState = {
  name: string;
  email: string;
  password: string;
  roles: Role[];
};

const DEFAULT_TOAST: ToastState = { open: false, status: "success", message: "" };

function toRoleArray(value: UserWithRoles["roles"]): Role[] {
  if (Array.isArray(value)) return [...value];
  if (value) return [value];
  return [];
}

function areRoleSelectionsEqual(a: Role[], b: Role[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((role, index) => role === right[index]);
}

const createInviteFormState = (): InviteFormState => ({
  name: "",
  email: "",
  password: "",
  roles: [],
});

type UseRbacManagementPanelOptions = {
  users: UserWithRoles[];
  roleDetails: Record<Role, RoleDetail>;
  onSaveUser: SaveUserAction;
  onInvite: InviteUserAction;
};

type UserTag = { variant: "success" | "warning"; label: string };

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

export function useRbacManagementPanel({
  users,
  roleDetails,
  onSaveUser,
  onInvite,
}: UseRbacManagementPanelOptions): UseRbacManagementPanelResult {
  const [knownUsers, setKnownUsers] = useState<UserWithRoles[]>(() => [...users]);
  const [selections, setSelections] = useState<SelectionState>(() =>
    users.reduce<SelectionState>((acc, user) => {
      acc[user.id] = toRoleArray(user.roles);
      return acc;
    }, {})
  );
  const [initialSelections, setInitialSelections] = useState<SelectionState>(() => ({
    ...users.reduce<SelectionState>((acc, user) => {
      acc[user.id] = toRoleArray(user.roles);
      return acc;
    }, {}),
  }));
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(DEFAULT_TOAST);
  const [isSaving, startSaveTransition] = useTransition();
  const [isInviting, startInviteTransition] = useTransition();
  const [inviteForm, setInviteForm] = useState<InviteFormState>(() =>
    createInviteFormState()
  );

  const showToast = useCallback((status: ActionStatus, message: string) => {
    setToast({ open: true, status, message });
  }, []);

  const closeToast = useCallback(() => {
    setToast((current) => ({ ...current, open: false }));
  }, []);

  const getSelectedRoles = useCallback(
    (userId: string) => selections[userId] ?? [],
    [selections]
  );

  const toggleUserRole = useCallback((userId: string, role: Role) => {
    setSelections((prev) => {
      const current = prev[userId] ?? [];
      const exists = current.includes(role);
      const next = exists
        ? current.filter((value) => value !== role)
        : [...current, role];
      return { ...prev, [userId]: next };
    });
  }, []);

  const getUserTag = useCallback(
    (userId: string): UserTag => {
      const current = selections[userId] ?? [];
      const initial = initialSelections[userId] ?? [];
      if (current.length === 0) {
        return { variant: "warning", label: "Role assignment required" };
      }
      if (!areRoleSelectionsEqual(current, initial)) {
        return { variant: "warning", label: "Pending changes" };
      }
      return {
        variant: "success",
        label: `${current.length} ${current.length === 1 ? "role" : "roles"} active`,
      };
    },
    [initialSelections, selections]
  );

  const getHelperText = useCallback(
    (userId: string) => {
      const selected = selections[userId] ?? [];
      if (selected.length === 0) {
        return "Assign at least one role so the user can sign in.";
      }
      const readable = selected
        .map((role) => roleDetails[role]?.title ?? role)
        .join(", ");
      return `Selected roles: ${readable}. Hover each option to review its permissions.`;
    },
    [roleDetails, selections]
  );

  const resetUserSelection = useCallback(
    (userId: string) => {
      setSelections((prev) => ({
        ...prev,
        [userId]: [...(initialSelections[userId] ?? [])],
      }));
    },
    [initialSelections]
  );

  const saveUser = useCallback(
    (user: UserWithRoles) => {
      const selected = selections[user.id] ?? [];
      if (selected.length === 0) {
        showToast(
          "error",
          `Assign at least one role before saving changes for ${user.name}.`
        );
        return;
      }

      setPendingUserId(user.id);
      startSaveTransition(() => {
        onSaveUser({ id: user.id, roles: selected })
          .then((result) => {
            showToast(result.status, result.message);
            if (result.status === "success") {
              setInitialSelections((prev) => ({
                ...prev,
                [user.id]: [...selected],
              }));
            }
          })
          .catch((error: unknown) => {
            const message =
              error instanceof Error
                ? error.message
                : "Failed to update user roles.";
            showToast("error", message);
          })
          .finally(() => {
            setPendingUserId((current) => (current === user.id ? null : current));
          });
      });
    },
    [onSaveUser, selections, showToast]
  );

  const isUserSaving = useCallback(
    (userId: string) => isSaving && pendingUserId === userId,
    [isSaving, pendingUserId]
  );

  const updateInviteField = useCallback(
    (field: "name" | "email" | "password", value: string) => {
      setInviteForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const toggleInviteRole = useCallback((role: Role) => {
    setInviteForm((prev) => {
      const exists = prev.roles.includes(role);
      const nextRoles = exists
        ? prev.roles.filter((value) => value !== role)
        : [...prev.roles, role];
      return { ...prev, roles: nextRoles };
    });
  }, []);

  const resetInviteForm = useCallback(() => {
    setInviteForm(createInviteFormState());
  }, []);

  const submitInvite = useCallback(() => {
    const trimmedName = inviteForm.name.trim();
    const trimmedEmail = inviteForm.email.trim();
    const password = inviteForm.password;
    const selectedRoles = inviteForm.roles;
    const issues: string[] = [];
    if (!trimmedName) {
      issues.push("Enter a name.");
    }
    if (!trimmedEmail) {
      issues.push("Provide an email address.");
    }
    if (!password) {
      issues.push("Set a temporary password.");
    }
    if (selectedRoles.length === 0) {
      issues.push("Assign at least one role.");
    }
    if (issues.length > 0) {
      showToast("error", issues.join(" "));
      return;
    }

    startInviteTransition(() => {
      onInvite({
        name: trimmedName,
        email: trimmedEmail,
        password,
        roles: selectedRoles,
      })
        .then((result) => {
          showToast(result.status, result.message);
          if (result.status === "success") {
            resetInviteForm();
            if (result.user) {
              const invited = result.user;
              setKnownUsers((prev) => {
                const index = prev.findIndex((item) => item.id === invited.id);
                if (index === -1) {
                  return [...prev, invited];
                }
                const copy = [...prev];
                copy[index] = invited;
                return copy;
              });
              const roleValues = toRoleArray(invited.roles);
              setSelections((prev) => ({
                ...prev,
                [invited.id]: roleValues,
              }));
              setInitialSelections((prev) => ({
                ...prev,
                [invited.id]: roleValues,
              }));
            }
          }
        })
        .catch((error: unknown) => {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to invite the user.";
          showToast("error", message);
        });
    });
  }, [inviteForm, onInvite, resetInviteForm, showToast]);

  const getInviteHelperText = useCallback(() => {
    return inviteForm.roles.length === 0
      ? "Choose at least one role so the invitee has access on first sign-in."
      : `Selected roles: ${inviteForm.roles
          .map((role) => roleDetails[role]?.title ?? role)
          .join(", ")}.`;
  }, [inviteForm.roles, roleDetails]);

  const toastClassName = useMemo(() => {
    return toast.status === "error"
      ? "bg-destructive text-destructive-foreground"
      : "bg-success text-success-fg";
  }, [toast.status]);

  return {
    users: knownUsers,
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
