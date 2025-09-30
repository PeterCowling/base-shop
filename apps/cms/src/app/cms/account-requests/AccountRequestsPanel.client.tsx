"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { Button, Card, CardContent, Tag } from "@/components/atoms/shadcn";
import { Toast, Tooltip } from "@/components/atoms";
import { Cluster } from "@ui/components/atoms/primitives/Cluster";
import { Inline } from "@ui/components/atoms/primitives/Inline";
import type { PendingUser } from "@cms/actions/accounts.server";
import type { Role } from "@cms/auth/roles";
import type { ActionResult, ActionStatus } from "../components/actionResult";
import type { RoleDetail } from "../components/roleDetails";
import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
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
          String(
            t("cms.accounts.requests.toast.selectRoleBeforeApprove", {
              name: request.name,
            })
          )
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
                : String(t("cms.accounts.requests.toast.approveFailedRequest"));
            showToast("error", message);
          })
          .finally(() => {
            setPendingId((current) => (current === request.id ? null : current));
          });
      });
    },
    [onApprove, selections, showToast, t]
  );

  const helperFor = useCallback(
    (requestId: string) => {
      const selected = selections[requestId] ?? [];
      if (selected.length === 0) {
        return t(
          "cms.accounts.requests.helper.selectAtLeastOne"
        ) as string;
      }
      const readable = selected
        .map((role) => roleDetails[role]?.title ?? role)
        .join(", ");
      return t("cms.accounts.requests.helper.grantPrivileges", {
        roles: readable,
      }) as string;
    },
    [roleDetails, selections, t]
  );

  const toastClassName = useMemo(() => {
    const v = toast.status === "error"
      ? "bg-destructive text-destructive-foreground" // i18n-exempt -- CMS-2615: class token string; not user copy [ttl=2026-01-01]
      : "bg-success text-success-fg"; // i18n-exempt -- CMS-2615: class token string; not user copy [ttl=2026-01-01]
    return v;
  }, [toast.status]);

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="min-w-0 font-medium text-foreground">{t("cms.accounts.requests.empty.title")}</span>
              <Tag className="shrink-0" variant="success">{t("cms.accounts.requests.empty.tag")}</Tag>
            </div>
            <p>{t("cms.accounts.requests.empty.desc")}</p>
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
        // i18n-exempt -- CMS-2617 [ttl=2026-01-01] non-UI data-testid
        const testId = "account-request-card";
        return (
          <Card key={request.id} data-testid={testId}>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="text-base font-semibold text-foreground">
                    {request.name}
                  </p>
                  <p className="text-sm text-muted-foreground">{request.email}</p>
                </div>
                <Tag className="shrink-0" variant="warning">{t("cms.accounts.requests.status.pendingApproval")}</Tag>
              </div>

              <section
                className="space-y-3"
                aria-labelledby={`roles-${request.id}`}
              >
                <p
                  id={`roles-${request.id}`}
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {t("cms.accounts.requests.roles.legend")}
                </p>
                <Cluster
                  gap={2}
                  role="group"
                  aria-label={t("cms.rbac.selectRolesFor", { name: request.name }) as string}
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
                        <Inline gap={2} alignY="center">
                          <span className="font-medium">
                            {detail?.title ?? role}
                          </span>
                          {detail && (
                            <Tooltip text={detail.description}>
                              {/* i18n-exempt -- CMS-1011 [ttl=2026-01-01] decorative icon */}
                              <span
                                aria-hidden="true"
                                className="text-xs text-muted-foreground underline decoration-dotted"
                              >
                                ?
                              </span>
                            </Tooltip>
                          )}
                        </Inline>
                      </Button>
                    );
                  })}
                </Cluster>
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
                    ? (t("cms.accounts.requests.actions.approving") as string)
                    : (t("cms.accounts.requests.actions.approveRequest") as string)}
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <a
                    href={`mailto:${request.email}`}
                    className="block w-full min-h-11 min-w-11 text-center inline-flex items-center justify-center"
                    aria-label={t("cms.accounts.requests.aria.emailUser", {
                      name: request.name,
                    }) as string}
                  >
                    {t("cms.accounts.requests.actions.emailRequester")}
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
