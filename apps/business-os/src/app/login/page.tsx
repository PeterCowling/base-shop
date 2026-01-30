/**
 * Login Page
 * MVP-B1: Invite-only auth system
 *
 * Simple login form with username + passcode fields.
 * On successful login, creates session and redirects to board.
 */

/* eslint-disable ds/no-unsafe-viewport-units, ds/container-widths-only-at, ds/enforce-focus-ring-token, ds/min-tap-size, ds/no-hardcoded-copy -- BOS-04 Phase 0 login page scaffold [ttl=2026-03-31] */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, passcode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        setIsLoading(false);
        return;
      }

      // Success - redirect to board
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-1 px-4">
      <div className="w-full max-w-md rounded-lg border border-border-2 bg-card p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Business OS
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Sign in to access your workspace
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="username"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label
              htmlFor="passcode"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Passcode
            </label>
            <input
              id="passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter your passcode"
            />
          </div>

          {error && (
            <div className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 rounded-md bg-info-soft px-3 py-2 text-xs text-info">
          <strong>Development mode:</strong> Use one of the predefined accounts
          (pete/pete123, cristiana/cristiana123, avery/avery123)
        </div>
      </div>
    </div>
  );
}
