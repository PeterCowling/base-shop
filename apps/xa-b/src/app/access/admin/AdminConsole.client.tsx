"use client";


import * as React from "react";

import { Button, Input } from "@acme/design-system/atoms";
import { ElevatedPanel } from "@acme/ui/components/organisms/ElevatedPanel";

import { xaI18n } from "../../../lib/xaI18n";
import { gateClassNames } from "../gateClasses";

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
      setError(err instanceof Error ? err.message : xaI18n.t("xaB.src.app.access.admin.adminconsole.client.l116c53"));
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
      setError(err instanceof Error ? err.message : xaI18n.t("xaB.src.app.access.admin.adminconsole.client.l144c53"));
    } finally {
      setBusy(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm(xaI18n.t("xaB.src.app.access.admin.adminconsole.client.l151c18"))) return;
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
      setError(err instanceof Error ? err.message : xaI18n.t("xaB.src.app.access.admin.adminconsole.client.l163c53"));
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
      setLastIssuedLabel(handle ? `Request: ${handle}` : xaI18n.t("xaB.src.app.access.admin.adminconsole.client.l181c58"));
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
      setError(err instanceof Error ? err.message : xaI18n.t("xaB.src.app.access.admin.adminconsole.client.l202c53"));
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
      <div className={`text-sm ${gateClassNames.mutedText}`}>{xaI18n.t("xaB.src.app.access.admin.adminconsole.client.l219c62")}</div>
    );
  }

  if (!session.authenticated) {
    return (
      <div className="space-y-6">
        <div className={`text-sm ${gateClassNames.mutedText}`}>{xaI18n.t("xaB.src.app.access.admin.adminconsole.client.l226c64")}</div>
        <form onSubmit={handleLogin} className="space-y-4">
          <label className={gateClassNames.fieldLabel}>{xaI18n.t("xaB.src.app.access.admin.adminconsole.client.l230c56")}<Input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              className={gateClassNames.fieldInput}
              autoComplete="off"
            />
          </label>
          <Button
            type="submit"
            disabled={busy}
            className={gateClassNames.primaryButton}
          >
            {busy ? "Verifying..." : xaI18n.t("xaB.src.app.access.admin.adminconsole.client.l244c38")}
          </Button>
          {error ? <div className="text-sm text-danger-fg">{error}</div> : null}
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className={gateClassNames.eyebrow}>{xaI18n.t("xaB.src.app.access.admin.adminconsole.client.l256c51")}</div>
          <div className={`text-sm ${gateClassNames.inkText}`}>
            Storage: {session?.storeMode ?? "unknown"}
          </div>
        </div>
        <Button
          type="button"
          onClick={handleLogout}
          variant="ghost"
          className="rounded-md border border-border-2 px-4 py-2 text-xs uppercase xa-tracking-030 xa-gate-text-ink transition hover:bg-transparent hover:underline"
        >
          Exit console
        </Button>
      </div>

      {lastIssued ? (
        <div className="rounded-md border border-border-2 bg-muted p-4 text-sm">
          <div className={gateClassNames.eyebrow}>{xaI18n.t("xaB.src.app.access.admin.adminconsole.client.l275c51")}</div>
          <div className={`mt-2 flex flex-wrap items-center gap-3 ${gateClassNames.inkText}`}>
            <span className={monoClassName}>{lastIssued}</span>
            {lastIssuedLabel ? (
              <span className={`text-xs ${gateClassNames.mutedText}`}>{lastIssuedLabel}</span>
            ) : null}
            <Button
              type="button"
              onClick={copyLastIssued}
              variant="outline"
              size="sm"
              className={gateClassNames.subtleButton}
            >
              Copy
            </Button>
          </div>
        </div>
      ) : null}

      <ElevatedPanel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className={gateClassNames.eyebrowWide}>
              Issue a key
            </div>
            <div className={`mt-2 text-sm ${gateClassNames.mutedText}`}>{xaI18n.t("xaB.src.app.access.admin.adminconsole.client.l302c73")}</div>
          </div>
          <Button
            type="button"
            onClick={() => loadData().catch(() => null)}
            variant="outline"
            size="sm"
            className={gateClassNames.subtleButton}
          >
            Refresh
          </Button>
        </div>

        <form onSubmit={handleCreateInvite} className="mt-6 grid gap-4 md:grid-cols-3">
          <label className={gateClassNames.fieldLabel}>
            Label
            <Input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Inner circle"
              className={gateClassNames.fieldInputCompact}
            />
          </label>
          <label className={gateClassNames.fieldLabel}>
            Max uses
            <Input
              value={maxUses}
              onChange={(event) => setMaxUses(event.target.value)}
              type="number"
              min="1"
              className={gateClassNames.fieldInputCompact}
            />
          </label>
          <label className={gateClassNames.fieldLabel}>
            Expires
            <Input
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              type={xaI18n.t("xaB.src.app.access.admin.adminconsole.client.l342c20")}
              className={gateClassNames.fieldInputCompact}
            />
          </label>
          <Button
            type="submit"
            disabled={busy}
            className={`md:col-span-3 justify-center ${gateClassNames.primaryButton}`}
          >
            {busy ? "Creating..." : "Generate key"}
          </Button>
        </form>
      </ElevatedPanel>

      <ElevatedPanel>
        <div className={gateClassNames.eyebrowWide}>{xaI18n.t("xaB.src.app.access.admin.adminconsole.client.l357c53")}</div>
        <div className="mt-4 space-y-4">
          {requests.length === 0 ? (
            <div className={`text-sm ${gateClassNames.mutedText}`}>{xaI18n.t("xaB.src.app.access.admin.adminconsole.client.l362c68")}</div>
          ) : null}
          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-md border border-border-2 bg-muted p-4 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className={gateClassNames.inkText}>
                  {request.handle || "Anonymous"}{" "}
                  <span className={`text-xs ${gateClassNames.mutedText}`}>
                    ({new Date(request.createdAt).toLocaleString()})
                  </span>
                </div>
                <div className={`text-xs uppercase xa-tracking-020 ${gateClassNames.mutedText}`}>
                  {request.status}
                </div>
              </div>
              <div className={`mt-2 ${gateClassNames.mutedText}`}>
                {request.referredBy ? `Sent by: ${request.referredBy}` : "No referrer"}
              </div>
              <div className={`mt-2 ${gateClassNames.inkText}`}>{request.note}</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={() => handleIssueRequest(request.id, request.handle)}
                  disabled={busy || request.status !== "pending"}
                  size="sm"
                  className="h-auto min-h-0 rounded-md border xa-gate-border-ink xa-gate-bg-ink px-3 py-1 text-xs uppercase xa-tracking-030 text-primary-fg transition hover:opacity-90 disabled:opacity-50"
                >
                  Issue key
                </Button>
                <Button
                  type="button"
                  onClick={() => handleDismissRequest(request.id)}
                  disabled={busy || request.status !== "pending"}
                  variant="outline"
                  size="sm"
                  className={gateClassNames.subtleButton}
                >
                  Dismiss
                </Button>
                {request.requestIp ? (
                  <span className={gateClassNames.tinyMeta}>
                    {request.requestIp}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </ElevatedPanel>

      <ElevatedPanel>
        <div className={gateClassNames.eyebrowWide}>
          Issued keys
        </div>
        <div className="mt-4 space-y-3 text-sm">
          {invites.length === 0 ? (
            <div className={gateClassNames.mutedText}>{xaI18n.t("xaB.src.app.access.admin.adminconsole.client.l421c55")}</div>
          ) : null}
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-2 bg-muted p-3"
            >
              <div>
                <div className={gateClassNames.inkText}>
                  {invite.label || "Untitled"}{" "}
                  <span className={`text-xs ${gateClassNames.mutedText}`}>
                    • {invite.codeHint}
                  </span>
                </div>
                <div className={`text-xs ${gateClassNames.mutedText}`}>
                  {invite.uses}/{invite.maxUses ?? "∞"} uses · {invite.status}
                </div>
              </div>
              <Button
                type="button"
                onClick={() => handleRevokeInvite(invite.id)}
                disabled={busy || invite.status !== "active"}
                variant="outline"
                size="sm"
                className={gateClassNames.subtleButton}
              >
                Revoke
              </Button>
            </div>
          ))}
        </div>
      </ElevatedPanel>

      {error ? <div className="text-sm text-danger-fg">{error}</div> : null}
    </div>
  );
}
