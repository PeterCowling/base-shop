"use client";

import { useCallback } from "react";

import { useToast } from "@acme/ui/operations";

import type { ActionResult } from "../components/actionResult";
import CampaignSender, {
  type CampaignSenderProps,
} from "../marketing/components/CampaignSender";

export default function CampaignPage() {
  const toast = useToast();

  const showToast = useCallback((result: ActionResult) => {
    if (result.status === "error") {
      toast.error(result.message);
    } else {
      toast.success(result.message);
    }
  }, [toast]);

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
    </div>
  );
}
