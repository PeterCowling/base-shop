import { Resend } from "resend";
import { coreEnv } from "@acme/config/env/core";
import type { CampaignOptions } from "../send";
import type { CampaignProvider, CampaignStat } from "./types";

export class ResendProvider implements CampaignProvider {
  private client: Resend;

  constructor() {
    this.client = new Resend(coreEnv.RESEND_API_KEY || "");
  }

  async send(options: CampaignOptions): Promise<void> {
    await this.client.emails.send({
      from: coreEnv.CAMPAIGN_FROM || "no-reply@example.com",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }

  async getCampaignStats(): Promise<CampaignStat[]> {
    // Resend currently lacks a public stats API; return empty metrics.
    return [];
  }
}
