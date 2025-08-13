import { Resend } from "resend";
import * as Sentry from "@sentry/node";
import { coreEnv } from "@acme/config/env/core";
import type { CampaignOptions } from "../send";
import { ProviderError } from "./types";
import type { CampaignProvider } from "./types";
import { mapResendStats, type CampaignStats } from "../analytics";

export class ResendProvider implements CampaignProvider {
  private client: Resend;

  constructor() {
    this.client = new Resend(coreEnv.RESEND_API_KEY || "");
  }

  async send(options: CampaignOptions): Promise<void> {
    try {
      await this.client.emails.send({
        from: coreEnv.CAMPAIGN_FROM || "no-reply@example.com",
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
    } catch (error: any) {
      const status = error?.code ?? error?.response?.statusCode ?? error?.statusCode;
      const retryable = typeof status !== "number" || status >= 500;
      const context = {
        provider: "resend",
        campaignId: options.campaignId,
        to: options.to,
      };
      try {
        Sentry.captureException(error, { extra: context });
      } catch {
        /* ignore Sentry failure */
      }
      console.error("Resend send error", context);
      throw new ProviderError(error.message, retryable);
    }
  }

  async getCampaignStats(id: string): Promise<CampaignStats> {
    try {
      const res = await fetch(`https://api.resend.com/campaigns/${id}/stats`, {
        headers: {
          Authorization: `Bearer ${coreEnv.RESEND_API_KEY || ""}`,
        },
      });
      const json = await res.json().catch(() => ({}));
      return mapResendStats(json);
    } catch {
      return mapResendStats({});
    }
  }
}
