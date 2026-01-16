"use client";

import { useCallback, useMemo, useState } from "react";
import {
  marketingEmailTemplates,
  type MarketingEmailTemplateVariant,
} from "@acme/email-templates";
import { Toast } from "@acme/ui/components/atoms";
import type { ActionResult, ActionStatus } from "../../components/actionResult";
import EmailCampaignComposer, {
  type EmailCampaignComposerProps,
} from "../components/EmailCampaignComposer";

type ToastState = { open: boolean; status: ActionStatus; message: string };

const defaultToast: ToastState = { open: false, status: "success", message: "" };

export default function EmailMarketingPage() {
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

  const loadSegments = useCallback<EmailCampaignComposerProps["loadSegments"]>(
    async (shop: string) => {
      const res = await fetch(`/api/segments?shop=${encodeURIComponent(shop)}`);
      if (!res.ok) {
        throw new Error("Failed to load segments");
      }
      const json = (await res.json()) as {
        segments?: { id: string; name?: string }[];
      };
      return json.segments ?? [];
    },
    [],
  );

  const loadCampaigns = useCallback<EmailCampaignComposerProps["loadCampaigns"]>(
    async (shop: string) => {
      const res = await fetch(`/api/marketing/email?shop=${encodeURIComponent(shop)}`);
      if (!res.ok) {
        throw new Error("Failed to load campaigns");
      }
      const json = (await res.json()) as {
        campaigns?: Awaited<ReturnType<EmailCampaignComposerProps["loadCampaigns"]>>;
      };
      return (json.campaigns ?? []) as Awaited<
        ReturnType<EmailCampaignComposerProps["loadCampaigns"]>
      >;
    },
    [],
  );

  const submitCampaign = useCallback<EmailCampaignComposerProps["submitCampaign"]>(
    async (payload) => {
      try {
        const res = await fetch("/api/marketing/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          return {
            status: "success",
            message: "Campaign queued for delivery.",
          } satisfies ActionResult;
        }
        let message = "Failed to queue campaign.";
        try {
          const json = (await res.json()) as { error?: string };
          if (json.error) message = json.error;
        } catch {
          // ignore json parse errors and fall back to default message
        }
        return { status: "error", message } satisfies ActionResult;
      } catch (error) {
        return {
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Network error while queuing campaign.",
        } satisfies ActionResult;
      }
    },
    [],
  );

  return (
    <div className="space-y-6 p-6">
      <EmailCampaignComposer
        templates={marketingEmailTemplates as MarketingEmailTemplateVariant[]}
        loadSegments={loadSegments}
        loadCampaigns={loadCampaigns}
        submitCampaign={submitCampaign}
        onNotify={showToast}
      />
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
