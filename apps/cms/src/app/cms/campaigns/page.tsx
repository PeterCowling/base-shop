"use client";

import { useCallback, useMemo, useState } from "react";

import { Toast } from "@acme/design-system/atoms";

import type { ActionResult, ActionStatus } from "../components/actionResult";
import CampaignSender, {
  type CampaignSenderProps,
} from "../marketing/components/CampaignSender";

type ToastState = { open: boolean; status: ActionStatus; message: string };

const defaultToast: ToastState = { open: false, status: "success", message: "" };

export default function CampaignPage() {
  const [toast, setToast] = useState<ToastState>(defaultToast);

  const showToast = useCallback((result: ActionResult) => {
    setToast({ open: true, status: result.status, message: result.message });
  }, []);

  const closeToast = useCallback(() => {
    setToast((current) => ({ ...current, open: false }));
  }, []);

  const toastClassName = useMemo(() => {
    return toast.status === "error"
      ? "bg-destructive text-destructive-foreground"
      : "bg-success text-success-fg";
  }, [toast.status]);

  const sendCampaign = useCallback<CampaignSenderProps["sendCampaign"]>(
    async (payload) => {
      try {
        const res = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: payload.to, subject: payload.subject, body: payload.body }),
        });
        if (res.ok) {
          return { status: "success", message: "Campaign sent." } satisfies ActionResult;
        }
        let message = "Unable to send campaign.";
        try {
          const json = (await res.json()) as { error?: string };
          if (json.error) message = json.error;
        } catch {}
        return { status: "error", message } satisfies ActionResult;
      } catch (error) {
        return {
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Network error while sending campaign.",
        } satisfies ActionResult;
      }
    },
    [],
  );

  return (
    <div className="space-y-6 p-6">
      <CampaignSender sendCampaign={sendCampaign} onNotify={showToast} />
      <Toast
        open={toast.open}
        message={toast.message}
        onClose={closeToast}
        className={toastClassName}
        role="status"
      />
    </div>
  );
}
