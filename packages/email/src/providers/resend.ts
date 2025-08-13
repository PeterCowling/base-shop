import { Resend } from "resend";
import { coreEnv } from "@acme/config/env/core";
import type { CampaignOptions } from "../send";
import { ProviderError } from "./types";
import type { CampaignProvider } from "./types";

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
      throw new ProviderError(error.message, retryable);
    }
  }
}
