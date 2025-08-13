import { Resend } from "resend";
import { coreEnv } from "@acme/config/env/core";
import type { CampaignOptions } from "../send";
import type { CampaignProvider } from "./types";
import { logEmailError } from "../logging";

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
    } catch (err) {
      await logEmailError(err, {
        campaignId: options.campaignId,
        to: options.to,
        provider: "resend",
      });
      throw err;
    }
  }
}
