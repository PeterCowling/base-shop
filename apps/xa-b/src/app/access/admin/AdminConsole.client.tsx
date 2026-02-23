"use client";


import * as React from "react";

import { Button, Input } from "@acme/design-system/atoms";
import { ElevatedPanel } from "@acme/ui/components/organisms/ElevatedPanel";

type SessionState = {
  authenticated: boolean;
  storeMode?: string;
};

type InviteSummary = {
  id: string;
  codeHint: string;
  label?: string;
  createdAt: string;
  expiresAt?: string;
  maxUses?: number;
  uses: number;
  revokedAt?: string;
  status?: string;
};

type RequestSummary = {
  id: string;
  handle: string;
  referredBy: string;
  note: string;
  createdAt: string;
  status: string;
  inviteId?: string;
  requestIp?: string;
};

type AdminConsoleProps = {
  monoClassName?: string;
};

export default function AdminConsole({ monoClassName }: AdminConsoleProps) {
  const [session, setSession] = React.useState<SessionState | null>(null);
  const [invites, setInvites] = React.useState<InviteSummary[]>([]);
  const [requests, setRequests] = React.useState<RequestSummary[]>([]);
  const [token, setToken] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [maxUses, setMaxUses] = React.useState("1");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [lastIssued, setLastIssued] = React.useState<string | null>(null);
  const [lastIssuedLabel, setLastIssuedLabel] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadSession = React.useCallback(async () => {
    const response = await fetch("/api/access-admin/session");
    const data = (await response.json()) as SessionState & { ok?: boolean };
    setSession({
      authenticated: Boolean(data.authenticated),
      storeMode: data.storeMode,
    });
  }, []);

  const loadData = React.useCallback(async () => {
    const [invitesResponse, requestsResponse] = await Promise.all([
      fetch("/api/access-admin/invites"),
      fetch("/api/access-admin/requests"),
    ]);
    if (!invitesResponse.ok || !requestsResponse.ok) {
      throw new Error("Unable to load admin data.");
    }
    const invitesData = (await invitesResponse.json()) as { invites: InviteSummary[] };
    const requestsData = (await requestsResponse.json()) as { requests: RequestSummary[] };
    setInvites(invitesData.invites ?? []);
    setRequests(requestsData.requests ?? []);
  }, []);

  React.useEffect(() => {
    loadSession().catch(() => setSession({ authenticated: false }));
  }, [loadSession]);

  React.useEffect(() => {
    if (!session?.authenticated) return;
    loadData().catch((err) => setError(err instanceof Error ? err.message : "Load failed"));
  }, [session, loadData]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/access-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) {
        throw new Error("Unauthorized");
      }
      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    setError(null);
    try {
      await fetch("/api/access-admin/logout", { method: "POST" });
      setSession({ authenticated: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/access-admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          maxUses: maxUses ? Number(maxUses) : undefined,
          expiresAt: expiresAt || undefined,
        }),
      });
      if (!response.ok) {
        throw new Error("Invite creation failed");
      }
      const data = (await response.json()) as { code: string };
      setLastIssued(data.code ?? null);
      setLastIssuedLabel(label || "Manual issue");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite creation failed");
    } finally {
      setBusy(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm("Revoke this key?")) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/access-admin/invites/${inviteId}/revoke`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Revoke failed");
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revoke failed");
    } finally {
      setBusy(false);
    }
  };

  const handleIssueRequest = async (requestId: string, handle?: string) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/access-admin/requests/${requestId}/issue`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Issue failed");
      }
      const data = (await response.json()) as { code?: string };
      setLastIssued(data.code ?? null);
      setLastIssuedLabel(handle ? `Request: ${handle}` : "Request issue");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Issue failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDismissRequest = async (requestId: string) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/access-admin/requests/${requestId}/dismiss`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Dismiss failed");
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dismiss failed");
    } finally {
      setBusy(false);
    }
  };

  const copyLastIssued = async () => {
    if (!lastIssued) return;
    try {
      await navigator.clipboard.writeText(lastIssued);
    } catch {
      setError("Copy failed");
    }
  };

  if (session === null) {
    return (
      <div className="text-sm text-[color:var(--gate-muted)]">Checking console access...</div>
    );
  }

  if (!session.authenticated) {
    return (
      <div className="space-y-6">
        <div className="text-sm text-[color:var(--gate-muted)]">
          Admin access requires the console token.
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
            Console token
            <Input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              className="mt-2 h-auto w-full rounded-md border-border-2 bg-surface px-3 py-3 text-sm text-[color:var(--gate-ink)] placeholder:text-[color:var(--gate-muted)] focus:border-[color:var(--gate-ink)] focus:ring-[color:var(--gate-ink)]/20"
              autoComplete="off"
            />
          </label>
          <Button
            type="submit"
            disabled={busy}
            className="h-auto inline-flex items-center gap-2 rounded-md border border-[color:var(--gate-ink)] bg-[color:var(--gate-ink)] px-4 py-2 text-sm font-semibold text-primary-fg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Verifying..." : "Enter console"}
          </Button>
          {error ? <div className="text-sm text-red-700">{error}</div> : null}
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
            Console active
          </div>
          <div className="text-sm text-[color:var(--gate-ink)]">
            Storage: {session?.storeMode ?? "unknown"}
          </div>
        </div>
        <Button
          type="button"
          onClick={handleLogout}
          variant="ghost"
          className="rounded-md border border-border-2 px-4 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--gate-ink)] transition hover:bg-transparent hover:underline"
        >
          Exit console
        </Button>
      </div>

      {lastIssued ? (
        <div className="rounded-md border border-border-2 bg-muted p-4 text-sm">
          <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
            Latest key issued
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[color:var(--gate-ink)]">
            <span className={monoClassName}>{lastIssued}</span>
            {lastIssuedLabel ? (
              <span className="text-xs text-[color:var(--gate-muted)]">{lastIssuedLabel}</span>
            ) : null}
            <Button
              type="button"
              onClick={copyLastIssued}
              variant="outline"
              size="sm"
              className="h-auto min-h-0 rounded-md border border-border-2 px-3 py-1 text-xs uppercase tracking-[0.3em] text-[color:var(--gate-ink)] hover:bg-transparent"
            >
              Copy
            </Button>
          </div>
        </div>
      ) : null}

      <ElevatedPanel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--gate-muted)]">
              Issue a key
            </div>
            <div className="mt-2 text-sm text-[color:var(--gate-muted)]">
              Create single-use or multi-use keys with optional expiry.
            </div>
          </div>
          <Button
            type="button"
            onClick={() => loadData().catch(() => null)}
            variant="outline"
            size="sm"
            className="h-auto min-h-0 rounded-md border border-border-2 px-3 py-1 text-xs uppercase tracking-[0.3em] text-[color:var(--gate-ink)] hover:bg-transparent"
          >
            Refresh
          </Button>
        </div>

        <form onSubmit={handleCreateInvite} className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
            Label
            <Input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Inner circle"
              className="mt-2 h-auto w-full rounded-md border-border-2 bg-surface px-3 py-2 text-sm text-[color:var(--gate-ink)] placeholder:text-[color:var(--gate-muted)] focus:border-[color:var(--gate-ink)] focus:ring-[color:var(--gate-ink)]/20"
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
            Max uses
            <Input
              value={maxUses}
              onChange={(event) => setMaxUses(event.target.value)}
              type="number"
              min="1"
              className="mt-2 h-auto w-full rounded-md border-border-2 bg-surface px-3 py-2 text-sm text-[color:var(--gate-ink)] focus:border-[color:var(--gate-ink)] focus:ring-[color:var(--gate-ink)]/20"
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
            Expires
            <Input
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              type="datetime-local"
              className="mt-2 h-auto w-full rounded-md border-border-2 bg-surface px-3 py-2 text-sm text-[color:var(--gate-ink)] focus:border-[color:var(--gate-ink)] focus:ring-[color:var(--gate-ink)]/20"
            />
          </label>
          <Button
            type="submit"
            disabled={busy}
            className="h-auto md:col-span-3 inline-flex items-center justify-center rounded-md border border-[color:var(--gate-ink)] bg-[color:var(--gate-ink)] px-4 py-2 text-sm font-semibold text-primary-fg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Creating..." : "Generate key"}
          </Button>
        </form>
      </ElevatedPanel>

      <ElevatedPanel>
        <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--gate-muted)]">
          Pending requests
        </div>
        <div className="mt-4 space-y-4">
          {requests.length === 0 ? (
            <div className="text-sm text-[color:var(--gate-muted)]">No pending signals.</div>
          ) : null}
          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-md border border-border-2 bg-muted p-4 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[color:var(--gate-ink)]">
                  {request.handle || "Anonymous"}{" "}
                  <span className="text-xs text-[color:var(--gate-muted)]">
                    ({new Date(request.createdAt).toLocaleString()})
                  </span>
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gate-muted)]">
                  {request.status}
                </div>
              </div>
              <div className="mt-2 text-[color:var(--gate-muted)]">
                {request.referredBy ? `Sent by: ${request.referredBy}` : "No referrer"}
              </div>
              <div className="mt-2 text-[color:var(--gate-ink)]">{request.note}</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={() => handleIssueRequest(request.id, request.handle)}
                  disabled={busy || request.status !== "pending"}
                  size="sm"
                  className="h-auto min-h-0 rounded-md border border-[color:var(--gate-ink)] bg-[color:var(--gate-ink)] px-3 py-1 text-xs uppercase tracking-[0.3em] text-primary-fg transition hover:opacity-90 disabled:opacity-50"
                >
                  Issue key
                </Button>
                <Button
                  type="button"
                  onClick={() => handleDismissRequest(request.id)}
                  disabled={busy || request.status !== "pending"}
                  variant="outline"
                  size="sm"
                  className="h-auto min-h-0 rounded-md border border-border-2 px-3 py-1 text-xs uppercase tracking-[0.3em] text-[color:var(--gate-ink)] hover:bg-transparent disabled:opacity-50"
                >
                  Dismiss
                </Button>
                {request.requestIp ? (
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
                    {request.requestIp}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </ElevatedPanel>

      <ElevatedPanel>
        <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--gate-muted)]">
          Issued keys
        </div>
        <div className="mt-4 space-y-3 text-sm">
          {invites.length === 0 ? (
            <div className="text-[color:var(--gate-muted)]">No issued keys.</div>
          ) : null}
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-2 bg-muted p-3"
            >
              <div>
                <div className="text-[color:var(--gate-ink)]">
                  {invite.label || "Untitled"}{" "}
                  <span className="text-xs text-[color:var(--gate-muted)]">
                    • {invite.codeHint}
                  </span>
                </div>
                <div className="text-xs text-[color:var(--gate-muted)]">
                  {invite.uses}/{invite.maxUses ?? "∞"} uses · {invite.status}
                </div>
              </div>
              <Button
                type="button"
                onClick={() => handleRevokeInvite(invite.id)}
                disabled={busy || invite.status !== "active"}
                variant="outline"
                size="sm"
                className="h-auto min-h-0 rounded-md border border-border-2 px-3 py-1 text-xs uppercase tracking-[0.3em] text-[color:var(--gate-ink)] hover:bg-transparent disabled:opacity-50"
              >
                Revoke
              </Button>
            </div>
          ))}
        </div>
      </ElevatedPanel>

      {error ? <div className="text-sm text-red-700">{error}</div> : null}
    </div>
  );
}
