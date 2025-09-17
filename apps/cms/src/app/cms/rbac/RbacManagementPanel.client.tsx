"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { Button, Card, CardContent, Input, Tag } from "@/components/atoms/shadcn";
import { Toast, Tooltip } from "@/components/atoms";
import type { UserWithRoles } from "@cms/actions/rbac.server";
import type { Role } from "@cms/auth/roles";
import type { ActionResult, ActionStatus } from "../components/actionResult";
import type { RoleDetail } from "../components/roleDetails";

interface SavePayload {
  id: string;
  roles: Role[];
}

interface InvitePayload {
  name: string;
  email: string;
  password: string;
  roles: Role[];
}

export type SaveUserAction = (payload: SavePayload) => Promise<ActionResult>;
export type InviteUserAction = (
  payload: InvitePayload
) => Promise<ActionResult & { user?: UserWithRoles }>;

type ToastState = ActionResult & { open: boolean };

type SelectionState = Record<string, Role[]>;

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

type RbacManagementPanelProps = {
  users: UserWithRoles[];
  roles: Role[];
  roleDetails: Record<Role, RoleDetail>;
  onSaveUser: SaveUserAction;
  onInvite: InviteUserAction;
};

export default function RbacManagementPanel({
  users,
  roles,
  roleDetails,
  onSaveUser,
  onInvite,
}: RbacManagementPanelProps) {
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

  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    password: "",
    roles: [] as Role[],
  });

  const showToast = useCallback((status: ActionStatus, message: string) => {
    setToast({ open: true, status, message });
  }, []);

  const closeToast = useCallback(() => {
    setToast((current) => ({ ...current, open: false }));
  }, []);

  const toggleSelection = useCallback((userId: string, role: Role) => {
    setSelections((prev) => {
      const current = prev[userId] ?? [];
      const exists = current.includes(role);
      const next = exists
        ? current.filter((value) => value !== role)
        : [...current, role];
      return { ...prev, [userId]: next };
    });
  }, []);

  const tagForUser = useCallback(
    (userId: string) => {
      const current = selections[userId] ?? [];
      const initial = initialSelections[userId] ?? [];
      if (current.length === 0) {
        return { variant: "warning" as const, label: "Role assignment required" };
      }
      if (!areRoleSelectionsEqual(current, initial)) {
        return { variant: "warning" as const, label: "Pending changes" };
      }
      return {
        variant: "success" as const,
        label: `${current.length} ${current.length === 1 ? "role" : "roles"} active`,
      };
    },
    [initialSelections, selections]
  );

  const helperTextFor = useCallback(
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

  const handleReset = useCallback((userId: string) => {
    setSelections((prev) => ({
      ...prev,
      [userId]: [...(initialSelections[userId] ?? [])],
    }));
  }, [initialSelections]);

  const handleSave = useCallback(
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

  const updateInviteRoles = useCallback((role: Role) => {
    setInviteForm((prev) => {
      const exists = prev.roles.includes(role);
      const nextRoles = exists
        ? prev.roles.filter((value) => value !== role)
        : [...prev.roles, role];
      return { ...prev, roles: nextRoles };
    });
  }, []);

  const resetInviteForm = useCallback(() => {
    setInviteForm({ name: "", email: "", password: "", roles: [] });
  }, []);

  const handleInviteSubmit = useCallback(() => {
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

  const toastClassName = useMemo(() => {
    return toast.status === "error"
      ? "bg-destructive text-destructive-foreground"
      : "bg-success text-success-fg";
  }, [toast.status]);

  return (
    <div className="space-y-6">
      {knownUsers.map((user) => {
        const { variant, label } = tagForUser(user.id);
        const selected = selections[user.id] ?? [];
        return (
          <Card key={user.id} data-testid="rbac-user-card">
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Tag variant={variant}>{label}</Tag>
              </div>

              <section
                className="space-y-3"
                aria-labelledby={`role-picker-${user.id}`}
              >
                <p
                  id={`role-picker-${user.id}`}
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Manage permissions
                </p>
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label={`Select roles for ${user.name}`}
                >
                  {roles.map((role) => {
                    const detail = roleDetails[role];
                    const isSelected = selected.includes(role);
                    return (
                      <Button
                        key={role}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        aria-pressed={isSelected}
                        onClick={() => toggleSelection(user.id, role)}
                        className="h-auto px-3 py-2 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-medium">
                            {detail?.title ?? role}
                          </span>
                          {detail && (
                            <Tooltip text={detail.description}>
                              <span
                                aria-hidden="true"
                                className="text-xs text-muted-foreground underline decoration-dotted"
                              >
                                ?
                              </span>
                            </Tooltip>
                          )}
                        </span>
                      </Button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">{helperTextFor(user.id)}</p>
              </section>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => handleSave(user)}
                  disabled={isSaving && pendingUserId === user.id}
                  className="flex-1"
                >
                  {isSaving && pendingUserId === user.id
                    ? "Saving…"
                    : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleReset(user.id)}
                  className="flex-1"
                  disabled={isSaving && pendingUserId === user.id}
                >
                  Reset selection
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Invite User</h3>
            <Tag variant="warning">Manual invite</Tag>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">Name</span>
              <Input
                name="name"
                value={inviteForm.name}
                onChange={(event) =>
                  setInviteForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">Email</span>
              <Input
                name="email"
                type="email"
                value={inviteForm.email}
                onChange={(event) =>
                  setInviteForm((prev) => ({ ...prev, email: event.target.value }))
                }
              />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-foreground">Temporary password</span>
              <Input
                name="password"
                type="password"
                value={inviteForm.password}
                onChange={(event) =>
                  setInviteForm((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <section className="space-y-3" aria-labelledby="invite-roles">
            <p
              id="invite-roles"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Assign starter roles
            </p>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Assign roles for the invitation"
            >
              {roles.map((role) => {
                const detail = roleDetails[role];
                const isSelected = inviteForm.roles.includes(role);
                return (
                  <Button
                    key={role}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    aria-pressed={isSelected}
                    onClick={() => updateInviteRoles(role)}
                    className="h-auto px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-medium">
                        {detail?.title ?? role}
                      </span>
                      {detail && (
                        <Tooltip text={detail.description}>
                          <span
                            aria-hidden="true"
                            className="text-xs text-muted-foreground underline decoration-dotted"
                          >
                            ?
                          </span>
                        </Tooltip>
                      )}
                    </span>
                  </Button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {inviteForm.roles.length === 0
                ? "Choose at least one role so the invitee has access on first sign-in."
                : `Selected roles: ${inviteForm.roles
                    .map((role) => roleDetails[role]?.title ?? role)
                    .join(", ")}.`}
            </p>
          </section>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              onClick={handleInviteSubmit}
              disabled={isInviting}
              className="flex-1"
            >
              {isInviting ? "Sending invite…" : "Send invite"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetInviteForm}
              disabled={isInviting}
              className="flex-1"
            >
              Clear form
            </Button>
          </div>
        </CardContent>
      </Card>

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
