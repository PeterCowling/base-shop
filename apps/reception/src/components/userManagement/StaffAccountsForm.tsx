"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@acme/design-system/atoms";
import { Cluster, Inline } from "@acme/design-system/primitives";

import { useAuth } from "../../context/AuthContext";
import { canAccess, Permissions } from "../../lib/roles";
import { isStaffAccountsPeteIdentity } from "../../lib/staffAccountsAccess";
import {
  getFirebaseAuth,
  sendPasswordResetEmail,
} from "../../services/firebaseAuth";
import { useFirebaseApp } from "../../services/useFirebase";
import type { UserRole } from "../../types/domains/userDomain";

const MANAGED_ROLES: UserRole[] = ["staff", "manager", "admin"];

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | {
      status: "success";
      email: string;
      setupEmailSent: boolean;
      setupEmailError?: string;
    }
  | { status: "error"; message: string };

type StaffAccount = {
  uid: string;
  email: string;
  user_name: string;
  displayName: string;
  roles: UserRole[];
  createdAt: number | null;
  updatedAt: number | null;
};

type AccountsResponse = {
  success: boolean;
  accounts?: StaffAccount[];
  error?: string;
};

async function fetchWithAuth(
  idToken: string,
  init: RequestInit,
): Promise<Response> {
  return fetch("/api/users/provision", {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...(init.headers ?? {}),
    },
  });
}

async function loadAccounts(
  idToken: string,
): Promise<{ success: true; accounts: StaffAccount[] } | { success: false; error: string }> {
  const response = await fetchWithAuth(idToken, { method: "GET" });
  const payload = (await response.json()) as AccountsResponse;

  if (!response.ok || !payload.success || !payload.accounts) {
    return {
      success: false,
      error: payload.error ?? "Failed to load staff accounts",
    };
  }

  return { success: true, accounts: payload.accounts };
}

async function provisionUser(
  idToken: string,
  payload: {
    email: string;
    user_name: string;
    displayName: string;
    roles: UserRole[];
  },
): Promise<{ success: true; uid: string } | { success: false; error: string }> {
  const response = await fetchWithAuth(idToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as
    | { success: true; uid: string }
    | { success: false; error: string };

  if (!response.ok || !data.success) {
    return {
      success: false,
      error:
        "error" in data
          ? data.error
          : response.status === 403
            ? "Insufficient permissions"
            : response.status === 409
              ? "An account with this email already exists"
              : "An unexpected error occurred",
    };
  }

  return { success: true, uid: data.uid };
}

async function updateAccountRoles(
  idToken: string,
  payload: { uid: string; roles: UserRole[] },
): Promise<{ success: true } | { success: false; error: string }> {
  const response = await fetchWithAuth(idToken, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as
    | { success: true }
    | { success: false; error: string };

  if (!response.ok || !data.success) {
    return {
      success: false,
      error: "error" in data ? data.error : "Failed to update roles",
    };
  }

  return { success: true };
}

async function removeStaffAccess(
  idToken: string,
  uid: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const response = await fetchWithAuth(idToken, {
    method: "DELETE",
    body: JSON.stringify({ uid }),
  });

  const data = (await response.json()) as
    | { success: true }
    | { success: false; error: string };

  if (!response.ok || !data.success) {
    return {
      success: false,
      error: "error" in data ? data.error : "Failed to remove staff access",
    };
  }

  return { success: true };
}

export default function StaffAccountsForm() {
  const { user } = useAuth();
  const app = useFirebaseApp();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [newRoles, setNewRoles] = useState<UserRole[]>(["staff"]);
  const [formState, setFormState] = useState<FormState>({ status: "idle" });

  const [accounts, setAccounts] = useState<StaffAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [removingUid, setRemovingUid] = useState<string | null>(null);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, UserRole[]>>({});

  const canManageAccounts =
    canAccess(user, [...Permissions.USER_MANAGEMENT]) &&
    isStaffAccountsPeteIdentity(user);

  const blockedReason = useMemo(() => {
    if (canManageAccounts) return null;
    if (!canAccess(user, [...Permissions.USER_MANAGEMENT])) {
      return "Staff Accounts requires owner/developer permissions.";
    }
    return "Staff Accounts is restricted to Pete account only.";
  }, [canManageAccounts, user]);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    const auth = getFirebaseAuth(app);
    return auth.currentUser?.getIdToken(true) ?? null;
  }, [app]);

  const refreshAccounts = useCallback(async () => {
    setAccountsLoading(true);
    setAccountsError(null);

    const idToken = await getIdToken();
    if (!idToken) {
      setAccountsError("Session expired — please sign in again.");
      setAccountsLoading(false);
      return;
    }

    const result = await loadAccounts(idToken);
    if (!result.success) {
      setAccountsError("error" in result ? result.error : "Failed to load accounts");
      setAccountsLoading(false);
      return;
    }

    setAccounts(result.accounts);
    setRoleDrafts(
      Object.fromEntries(
        result.accounts.map((account) => [
          account.uid,
          account.roles.filter((role) => MANAGED_ROLES.includes(role)),
        ]),
      ),
    );
    setAccountsLoading(false);
  }, [getIdToken]);

  useEffect(() => {
    if (!canManageAccounts) {
      setAccounts([]);
      setRoleDrafts({});
      setAccountsLoading(false);
      return;
    }

    void refreshAccounts();
  }, [canManageAccounts, refreshAccounts]);

  if (!canManageAccounts) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="mb-3 text-2xl font-semibold">Staff Accounts</h1>
        <p className="rounded-md border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          {blockedReason}
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (newRoles.length === 0) {
      setFormState({
        status: "error",
        message: "Select at least one role.",
      });
      return;
    }

    setFormState({ status: "submitting" });

    const idToken = await getIdToken();
    if (!idToken) {
      setFormState({
        status: "error",
        message: "Session expired — please sign in again.",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedDisplayName = displayName.trim() || normalizedEmail;

    const result = await provisionUser(idToken, {
      email: normalizedEmail,
      user_name: normalizedDisplayName,
      displayName: normalizedDisplayName,
      roles: newRoles,
    });

    if (!result.success) {
      setFormState({
        status: "error",
        message: "error" in result ? result.error : "Failed to create account",
      });
      return;
    }

    const auth = getFirebaseAuth(app);
    const resetResult = await sendPasswordResetEmail(auth, normalizedEmail);
    setFormState({
      status: "success",
      email: normalizedEmail,
      setupEmailSent: resetResult.success,
      ...(resetResult.success
        ? {}
        : {
            setupEmailError:
              resetResult.error ??
              "Account created, but the setup email could not be sent automatically.",
          }),
    });
    setEmail("");
    setDisplayName("");
    setNewRoles(["staff"]);
    await refreshAccounts();
  }

  async function handleResend() {
    if (formState.status !== "success") return;
    const auth = getFirebaseAuth(app);
    const resendResult = await sendPasswordResetEmail(auth, formState.email);
    if (!resendResult.success) {
      setFormState({
        ...formState,
        setupEmailSent: false,
        setupEmailError:
          resendResult.error ??
          "Could not resend the setup email. Please verify the address and try again.",
      });
      return;
    }
    setFormState({
      ...formState,
      setupEmailSent: true,
      setupEmailError: undefined,
    });
  }

  function toggleRole(
    currentRoles: UserRole[],
    role: UserRole,
    onChange: (next: UserRole[]) => void,
  ) {
    if (currentRoles.includes(role)) {
      onChange(currentRoles.filter((item) => item !== role));
      return;
    }
    onChange([...currentRoles, role]);
  }

  async function handleSaveRoles(account: StaffAccount) {
    const draftManagedRoles = roleDrafts[account.uid] ?? [];
    if (draftManagedRoles.length === 0) {
      setAccountsError("Each account needs at least one role.");
      return;
    }

    const idToken = await getIdToken();
    if (!idToken) {
      setAccountsError("Session expired — please sign in again.");
      return;
    }

    const preservedRoles = account.roles.filter(
      (role) => !MANAGED_ROLES.includes(role),
    );
    const nextRoles = Array.from(new Set([...preservedRoles, ...draftManagedRoles]));

    setEditingUid(account.uid);
    setAccountsError(null);

    const result = await updateAccountRoles(idToken, {
      uid: account.uid,
      roles: nextRoles,
    });

    setEditingUid(null);

    if (!result.success) {
      setAccountsError("error" in result ? result.error : "Failed to update account");
      return;
    }

    setAccounts((prev) =>
      prev.map((item) =>
        item.uid === account.uid ? { ...item, roles: nextRoles } : item,
      ),
    );
  }

  async function handleRemove(account: StaffAccount) {
    const confirmed = window.confirm(
      `Remove ${account.email} from Reception staff access?`,
    );
    if (!confirmed) return;

    const idToken = await getIdToken();
    if (!idToken) {
      setAccountsError("Session expired — please sign in again.");
      return;
    }

    setRemovingUid(account.uid);
    setAccountsError(null);

    const result = await removeStaffAccess(idToken, account.uid);
    setRemovingUid(null);

    if (!result.success) {
      setAccountsError("error" in result ? result.error : "Failed to remove staff access");
      return;
    }

    setAccounts((prev) => prev.filter((item) => item.uid !== account.uid));
    setRoleDrafts((prev) => {
      const next = { ...prev };
      delete next[account.uid];
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Staff Accounts</h1>

      <section className="mb-8 rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-4 text-lg font-semibold">Add Account</h2>

        {formState.status === "success" ? (
          <div className="rounded-lg border border-border bg-surface-2 p-4">
            <p className="mb-3 text-sm text-foreground">
              Account created for <strong>{formState.email}</strong>.{" "}
              {formState.setupEmailSent
                ? "A password setup email has been sent."
                : "Setup email delivery failed."}
            </p>
            {!formState.setupEmailSent && formState.setupEmailError ? (
              <p className="mb-3 rounded-md bg-danger/10 p-3 text-sm text-danger">
                {formState.setupEmailError}
              </p>
            ) : null}
            <Inline gap={3}>
              <Button
                type="button"
                color="primary"
                tone="solid"
                onClick={handleResend}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-fg"
              >
                Resend setup email
              </Button>
              <Button
                type="button"
                color="default"
                tone="outline"
                onClick={() => setFormState({ status: "idle" })}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium"
              >
                Add another
              </Button>
            </Inline>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {formState.status === "error" && (
              <p className="rounded-md bg-danger/10 p-3 text-sm text-danger">
                {formState.message}
              </p>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="displayName"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-foreground">
                Permissions
              </legend>
              <Inline gap={4} className="flex-wrap">
                {MANAGED_ROLES.map((role) => (
                  <label key={role} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newRoles.includes(role)}
                      onChange={() =>
                        toggleRole(newRoles, role, (next) => setNewRoles(next))
                      }
                    />
                    <span className="capitalize">{role}</span>
                  </label>
                ))}
              </Inline>
            </fieldset>

            <Button
              type="submit"
              color="primary"
              tone="solid"
              disabled={formState.status === "submitting"}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg disabled:opacity-60"
            >
              {formState.status === "submitting"
                ? "Creating account..."
                : "Create account"}
            </Button>
          </form>
        )}
      </section>

      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-4 text-lg font-semibold">Manage Existing Accounts</h2>

        {accountsError && (
          <p className="mb-4 rounded-md bg-danger/10 p-3 text-sm text-danger">
            {accountsError}
          </p>
        )}

        {accountsLoading ? (
          <p className="text-sm text-muted-foreground">Loading accounts...</p>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No staff accounts found.</p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => {
              const managedDraft = roleDrafts[account.uid] ?? [];
              const canSave = managedDraft.length > 0;

              return (
                <div
                  key={account.uid}
                  className="rounded-md border border-border bg-surface-2 p-3"
                >
                  <Cluster gap={2} justify="between" className="mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {account.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground">{account.email}</p>
                    </div>
                    <Button
                      type="button"
                      color="danger"
                      tone="outline"
                      onClick={() => void handleRemove(account)}
                      disabled={removingUid === account.uid}
                      className="rounded-md border border-danger px-3 py-1.5 text-xs font-medium text-danger disabled:opacity-60"
                    >
                      {removingUid === account.uid
                        ? "Removing access..."
                        : "Remove staff access"}
                    </Button>
                  </Cluster>

                  <Inline gap={4} className="mb-3 flex-wrap">
                    {MANAGED_ROLES.map((role) => (
                      <label key={role} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={managedDraft.includes(role)}
                          onChange={() =>
                            toggleRole(managedDraft, role, (next) =>
                              setRoleDrafts((prev) => ({
                                ...prev,
                                [account.uid]: next,
                              })),
                            )
                          }
                        />
                        <span className="capitalize">{role}</span>
                      </label>
                    ))}
                  </Inline>

                  <Button
                    type="button"
                    color="primary"
                    tone="solid"
                    onClick={() => void handleSaveRoles(account)}
                    disabled={!canSave || editingUid === account.uid}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-fg disabled:opacity-60"
                  >
                    {editingUid === account.uid ? "Saving..." : "Save permissions"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
