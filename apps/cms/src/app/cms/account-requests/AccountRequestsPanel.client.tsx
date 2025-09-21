"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { Button, Card, CardContent, Tag } from "@/components/atoms/shadcn";
import { Toast, Tooltip } from "@/components/atoms";
import type { PendingUser } from "@cms/actions/accounts.server";
import type { Role } from "@cms/auth/roles";
import type { ActionResult, ActionStatus } from "../components/actionResult";
import type { RoleDetail } from "../components/roleDetails";

interface ApprovePayload {
  id: string;
  name: string;
  roles: Role[];
}

export type ApproveAction = (payload: ApprovePayload) => Promise<ActionResult>;

type ToastState = ActionResult & { open: boolean };

type SelectionState = Record<string, Role[]>;

const DEFAULT_TOAST: ToastState = {
  open: false,
  status: "success",
  message: "",
};

function normalizeSelections(requests: PendingUser[]): SelectionState {
  return requests.reduce<SelectionState>((acc, request) => {
    acc[request.id] = [];
    return acc;
  }, {});
}

type AccountRequestsPanelProps = {
  requests: PendingUser[];
  roles: Role[];
  roleDetails: Record<Role, RoleDetail>;
  onApprove: ApproveAction;
};

export default function AccountRequestsPanel({
  requests,
  roles,
  roleDetails,
  onApprove,
}: AccountRequestsPanelProps) {
  const [items, setItems] = useState<PendingUser[]>(() => [...requests]);
  const [selections, setSelections] = useState<SelectionState>(() =>
    normalizeSelections(requests)
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(DEFAULT_TOAST);
  const [isPending, startTransition] = useTransition();

  const showToast = useCallback((status: ActionStatus, message: string) => {
    setToast({ open: true, status, message });
  }, []);

  const closeToast = useCallback(() => {
    setToast((current) => ({ ...current, open: false }));
  }, []);

  const toggleRole = useCallback(
    (requestId: string, role: Role) => {
      setSelections((prev) => {
        const current = prev[requestId] ?? [];
        const exists = current.includes(role);
        const next = exists
          ? current.filter((value) => value !== role)
          : [...current, role];
        return { ...prev, [requestId]: next };
      });
    },
    []
  );

  const handleApprove = useCallback(
    (request: PendingUser) => {
      const selected = selections[request.id] ?? [];
      if (selected.length === 0) {
        showToast(
          "error",
          `Select at least one role before approving ${request.name}.`
        );
        return;
      }

      setPendingId(request.id);
      startTransition(() => {
        onApprove({ id: request.id, name: request.name, roles: selected })
          .then((result) => {
            showToast(result.status, result.message);
            if (result.status === "success") {
              setItems((prev) => prev.filter((item) => item.id !== request.id));
            }
          })
          .catch((error: unknown) => {
            const message =
              error instanceof Error
                ? error.message
                : "Failed to approve account request.";
            showToast("error", message);
          })
          .finally(() => {
            setPendingId((current) => (current === request.id ? null : current));
          });
      });
    },
    [onApprove, selections, showToast]
  );

  const helperFor = useCallback(
    (requestId: string) => {
      const selected = selections[requestId] ?? [];
      if (selected.length === 0) {
        return "Select at least one role to include with the approval.";
      }
      const readable = selected
        .map((role) => roleDetails[role]?.title ?? role)
        .join(", ");
      return `Grant ${readable} privileges when approving.`;
    },
    [roleDetails, selections]
  );

  const toastClassName = useMemo(() => {
    return toast.status === "error"
      ? "bg-destructive text-destructive-foreground"
      : "bg-success text-success-fg";
  }, [toast.status]);

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="min-w-0 font-medium text-foreground">All requests reviewed</span>
              <Tag className="shrink-0" variant="success">Up to date</Tag>
            </div>
            <p>New account requests will appear here automatically.</p>
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

  return (
    <div className="space-y-4">
      {items.map((request) => {
        const selected = selections[request.id] ?? [];
        return (
          <Card key={request.id} data-testid="account-request-card">
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="text-base font-semibold text-foreground">
                    {request.name}
                  </p>
                  <p className="text-sm text-muted-foreground">{request.email}</p>
                </div>
                <Tag className="shrink-0" variant="warning">Pending approval</Tag>
              </div>

              <section
                className="space-y-3"
                aria-labelledby={`roles-${request.id}`}
              >
                <p
                  id={`roles-${request.id}`}
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Assign roles
                </p>
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label={`Assign roles for ${request.name}`}
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
                        onClick={() => toggleRole(request.id, role)}
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
                <p className="text-xs text-muted-foreground">{helperFor(request.id)}</p>
              </section>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => handleApprove(request)}
                  disabled={isPending && pendingId === request.id}
                  className="flex-1"
                >
                  {isPending && pendingId === request.id
                    ? "Approving…"
                    : "Approve request"}
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <a
                    href={`mailto:${request.email}`}
                    className="block w-full text-center"
                    aria-label={`Email ${request.name}`}
                  >
                    Email requester
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
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
