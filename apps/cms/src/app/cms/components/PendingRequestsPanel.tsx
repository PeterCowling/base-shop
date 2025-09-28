"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { approveAccount } from "@cms/actions/accounts.server";
import type { PendingUser } from "@cms/actions/accounts.server";
import type { Role } from "@cms/auth/roles";
import { Toast } from "@/components/atoms";
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Tag,
} from "@/components/atoms/shadcn";
import { Grid as DSGrid } from "@ui/components/atoms/primitives/Grid";
import { useTranslations } from "@acme/i18n";

interface PendingRequestsPanelProps {
  pending: PendingUser[];
  roles: Role[];
  headingId: string;
}

type ToastState = {
  open: boolean;
  message: string;
};

type SelectionState = Map<string, Set<Role>>;

export function PendingRequestsPanel({
  pending,
  roles,
  headingId,
}: PendingRequestsPanelProps) {
  const t = useTranslations();
  const [requests, setRequests] = useState(pending);
  const [selections, setSelections] = useState<SelectionState>(() => new Map());
  const [toast, setToast] = useState<ToastState>({ open: false, message: "" });
  const [isPending, startTransition] = useTransition();
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setRequests(pending);
  }, [pending]);

  const handleToggleRole = (requestId: string, role: Role) => {
    setSelections((prev) => {
      const next = new Map(prev);
      const existing = new Set(next.get(requestId) ?? []);
      if (existing.has(role)) {
        existing.delete(role);
      } else {
        existing.add(role);
      }
      next.set(requestId, existing);
      return next;
    });
  };

  useEffect(() => {
    if (!isPending && lastTriggerRef.current) {
      lastTriggerRef.current.focus();
    }
  }, [isPending]);

  const requestSummaries = useMemo(
    () =>
      requests.map((request) => ({
        id: request.id,
        name: request.name,
        email: request.email,
        roles: Array.from(selections.get(request.id) ?? []),
      })),
    [requests, selections]
  );

  const handleApprove = (requestId: string, button: HTMLButtonElement) => {
    const summary = requestSummaries.find((entry) => entry.id === requestId);
    if (!summary) return;
    lastTriggerRef.current = button;
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", summary.id);
      summary.roles.forEach((role) => formData.append("roles", role));
      try {
        await approveAccount(formData);
        setRequests((prev) => prev.filter((request) => request.id !== summary.id));
        setSelections((prev) => {
          const next = new Map(prev);
          next.delete(summary.id);
          return next;
        });
        setToast({
          open: true,
          message: String(t("cms.accounts.requests.toast.approved", { name: summary.name })),
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : String(t("cms.accounts.requests.toast.approveFailed"));
        setToast({ open: true, message });
      }
    });
  };

  return (
    <Card className="border border-border/60">
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id={headingId}
            tabIndex={-1}
            className="text-lg font-semibold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {t("cms.accounts.requests.heading")}
          </h2>
          <Tag className="shrink-0" variant={requests.length === 0 ? "success" : "warning"}>
            {requests.length === 0
              ? t("cms.accounts.requests.noneTag")
              : t("cms.accounts.requests.countTag", { count: requests.length })}
          </Tag>
        </div>

        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("cms.accounts.requests.empty")}
          </p>
        ) : (
          <div className="space-y-4">
            {requestSummaries.map((request) => (
              <div
                key={request.id}
                className="space-y-4 rounded-xl border border-border/60 bg-surface-3 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {request.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{request.email}</p>
                  </div>
                  <Tag className="shrink-0" variant="warning">{t("cms.accounts.requests.status.pending")}</Tag>
                </div>
                <fieldset className="space-y-3">
                  <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("cms.accounts.requests.roles.legend")}
                  </legend>
                  <DSGrid gap={2} className="sm:grid-cols-2">
                    {roles.map((role) => {
                      const checked = request.roles.includes(role);
                      const checkboxId = `${request.id}-${role}`;
                      return (
                        <label
                          key={role}
                          htmlFor={checkboxId}
                          className="flex items-center gap-2 rounded-lg border border-border/60 bg-surface-2 px-3 py-2 text-sm text-foreground"
                        >
                          <Checkbox
                            id={checkboxId}
                            checked={checked}
                            onCheckedChange={() => handleToggleRole(request.id, role)}
                            aria-label={String(t("cms.accounts.requests.roles.aria.grantRole", { role }))}
                          />
                          <span className="text-xs font-medium uppercase tracking-wide">
                            {role}
                          </span>
                        </label>
                      );
                    })}
                  </DSGrid>
                </fieldset>
                <Button
                  type="button"
                  className="w-full"
                  onClick={(event) =>
                    handleApprove(request.id, event.currentTarget)
                  }
                  disabled={isPending}
                >
                  {isPending
                    ? t("cms.accounts.requests.actions.approving")
                    : t("cms.accounts.requests.actions.approve")}
                </Button>
              </div>
            ))}
          </div>
        )}

        <Toast
          open={toast.open}
          message={toast.message}
          onClose={() => setToast({ open: false, message: "" })}
          role="status"
        />
      </CardContent>
    </Card>
  );
}
