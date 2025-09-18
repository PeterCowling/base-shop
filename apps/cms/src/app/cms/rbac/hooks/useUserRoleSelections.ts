import { useCallback, useState, useTransition } from "react";

import type { UserWithRoles } from "@cms/actions/rbac.server";
import type { Role } from "@cms/auth/roles";

import type { ActionResult, ActionStatus } from "../../components/actionResult";
import type { RoleDetail } from "../../components/roleDetails";

export type UserTag = { variant: "success" | "warning"; label: string };

const ROLE_WARNING_TAG: UserTag = {
  variant: "warning",
  label: "Role assignment required",
};

function toRoleArray(value: UserWithRoles["roles"]): Role[] {
  if (Array.isArray(value)) return [...value];
  if (value) return [value];
  return [];
}

function createSelectionState(users: UserWithRoles[]): SelectionState {
  return users.reduce<SelectionState>((acc, user) => {
    acc[user.id] = toRoleArray(user.roles);
    return acc;
  }, {});
}

function areRoleSelectionsEqual(a: Role[], b: Role[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((role, index) => role === right[index]);
}

type SelectionState = Record<string, Role[]>;

type SavePayload = {
  id: string;
  roles: Role[];
};

export type SaveUserAction = (payload: SavePayload) => Promise<ActionResult>;

type UseUserRoleSelectionsOptions = {
  users: UserWithRoles[];
  roleDetails: Record<Role, RoleDetail>;
  onSaveUser: SaveUserAction;
  showToast: (status: ActionStatus, message: string) => void;
};

type UseUserRoleSelectionsResult = {
  users: UserWithRoles[];
  getSelectedRoles: (userId: string) => Role[];
  getUserTag: (userId: string) => UserTag;
  getHelperText: (userId: string) => string;
  toggleUserRole: (userId: string, role: Role) => void;
  resetUserSelection: (userId: string) => void;
  saveUser: (user: UserWithRoles) => void;
  isUserSaving: (userId: string) => boolean;
  syncUser: (user: UserWithRoles) => void;
};

export function useUserRoleSelections({
  users,
  roleDetails,
  onSaveUser,
  showToast,
}: UseUserRoleSelectionsOptions): UseUserRoleSelectionsResult {
  const [knownUsers, setKnownUsers] = useState<UserWithRoles[]>(() => [...users]);
  const [selections, setSelections] = useState<SelectionState>(() =>
    createSelectionState(users)
  );
  const [initialSelections, setInitialSelections] = useState<SelectionState>(() =>
    createSelectionState(users)
  );
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();

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
        return ROLE_WARNING_TAG;
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

  const syncUser = useCallback((user: UserWithRoles) => {
    const roleValues = toRoleArray(user.roles);
    setKnownUsers((prev) => {
      const index = prev.findIndex((item) => item.id === user.id);
      if (index === -1) {
        return [...prev, user];
      }
      const copy = [...prev];
      copy[index] = user;
      return copy;
    });
    setSelections((prev) => ({
      ...prev,
      [user.id]: roleValues,
    }));
    setInitialSelections((prev) => ({
      ...prev,
      [user.id]: roleValues,
    }));
  }, []);

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

  return {
    users: knownUsers,
    getSelectedRoles,
    getUserTag,
    getHelperText,
    toggleUserRole,
    resetUserSelection,
    saveUser,
    isUserSaving,
    syncUser,
  };
}
