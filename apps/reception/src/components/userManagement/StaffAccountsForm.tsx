"use client";

import { useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { canAccess, Permissions } from "../../lib/roles";
import {
  getFirebaseAuth,
  sendPasswordResetEmail,
} from "../../services/firebaseAuth";
import { useFirebaseApp } from "../../services/useFirebase";

const ALLOWED_ROLES = ["staff", "manager", "admin"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; email: string }
  | { status: "error"; message: string };

async function provisionUser(
  idToken: string,
  payload: {
    email: string;
    user_name: string;
    displayName: string;
    role: AllowedRole;
  },
): Promise<{ success: true; uid: string } | { success: false; error: string }> {
  const response = await fetch("/api/users/provision", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as
    | { success: true; uid: string; email: string }
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

  return { success: true, uid: (data as { success: true; uid: string }).uid };
}

export default function StaffAccountsForm() {
  const { user } = useAuth();
  const app = useFirebaseApp();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<AllowedRole>("staff");
  const [formState, setFormState] = useState<FormState>({ status: "idle" });

  // Gate: only owner/developer can access this form
  if (!canAccess(user, [...Permissions.USER_MANAGEMENT])) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState({ status: "submitting" });

    const auth = getFirebaseAuth(app);
    const idToken = await auth.currentUser?.getIdToken(true);

    if (!idToken) {
      setFormState({
        status: "error",
        message: "Session expired — please sign in again.",
      });
      return;
    }

    const result = await provisionUser(idToken, {
      email: email.trim(),
      user_name: displayName.trim() || email.trim(),
      displayName: displayName.trim() || email.trim(),
      role,
    });

    if ("error" in result) {
      setFormState({ status: "error", message: result.error });
      return;
    }

    // Send password setup email
    const auth2 = getFirebaseAuth(app);
    await sendPasswordResetEmail(auth2, email.trim()).catch(() => {
      // Non-fatal: resend button available if this fails
    });

    setFormState({ status: "success", email: email.trim() });
    setEmail("");
    setDisplayName("");
    setRole("staff");
  }

  async function handleResend() {
    if (formState.status !== "success") return;
    const auth = getFirebaseAuth(app);
    await sendPasswordResetEmail(auth, formState.email);
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-semibold">Staff Accounts</h1>

      {formState.status === "success" ? (
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="mb-3 text-sm text-foreground">
            Account created for{" "}
            <strong>{formState.email}</strong>. A password setup email has been
            sent.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleResend}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-fg"
            >
              Resend setup email
            </button>
            <button
              type="button"
              onClick={() => setFormState({ status: "idle" })}
              className="rounded-md border border-border px-3 py-2 text-sm font-medium"
            >
              Create another
            </button>
          </div>
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

          <div>
            <label
              htmlFor="role"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as AllowedRole)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {ALLOWED_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={formState.status === "submitting"}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg disabled:opacity-60"
          >
            {formState.status === "submitting"
              ? "Creating account…"
              : "Create account"}
          </button>
        </form>
      )}
    </div>
  );
}
