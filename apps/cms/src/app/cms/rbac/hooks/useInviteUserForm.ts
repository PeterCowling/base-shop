import { useCallback, useState, useTransition } from "react";
import type { UserWithRoles } from "@cms/actions/rbac.server";
import type { Role } from "@cms/auth/roles";

import type { ActionResult, ActionStatus } from "../../components/actionResult";
import type { RoleDetail } from "../../components/roleDetails";

export type InviteFormState = {
  name: string;
  email: string;
  password: string;
  roles: Role[];
};

type InvitePayload = {
  name: string;
  email: string;
  password: string;
  roles: Role[];
};

export type InviteUserAction = (
  payload: InvitePayload
) => Promise<ActionResult & { user?: UserWithRoles }>;

type UseInviteUserFormOptions = {
  roleDetails: Record<Role, RoleDetail>;
  onInvite: InviteUserAction;
  showToast: (status: ActionStatus, message: string) => void;
  onInviteSuccess: (user: UserWithRoles) => void;
};

type UseInviteUserFormResult = {
  form: InviteFormState;
  updateField: (field: "name" | "email" | "password", value: string) => void;
  toggleRole: (role: Role) => void;
  resetForm: () => void;
  submit: () => void;
  isInviting: boolean;
  getHelperText: () => string;
};

const createInviteFormState = (): InviteFormState => ({
  name: "",
  email: "",
  password: "",
  roles: [],
});

export function useInviteUserForm({
  roleDetails,
  onInvite,
  showToast,
  onInviteSuccess,
}: UseInviteUserFormOptions): UseInviteUserFormResult {
  const [form, setForm] = useState<InviteFormState>(() => createInviteFormState());
  const [isInviting, startInviteTransition] = useTransition();

  const updateField = useCallback(
    (field: "name" | "email" | "password", value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const toggleRole = useCallback((role: Role) => {
    setForm((prev) => {
      const exists = prev.roles.includes(role);
      const nextRoles = exists
        ? prev.roles.filter((value) => value !== role)
        : [...prev.roles, role];
      return { ...prev, roles: nextRoles };
    });
  }, []);

  const resetForm = useCallback(() => {
    setForm(createInviteFormState());
  }, []);

  const submit = useCallback(() => {
    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    const password = form.password;
    const selectedRoles = form.roles;
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
            resetForm();
            if (result.user) {
              onInviteSuccess(result.user);
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
  }, [form, onInvite, onInviteSuccess, resetForm, showToast]);

  const getHelperText = useCallback(() => {
    return form.roles.length === 0
      ? "Choose at least one role so the invitee has access on first sign-in."
      : `Selected roles: ${form.roles
          .map((role) => roleDetails[role]?.title ?? role)
          .join(", ")}.`;
  }, [form.roles, roleDetails]);

  return {
    form,
    updateField,
    toggleRole,
    resetForm,
    submit,
    isInviting,
    getHelperText,
  };
}
