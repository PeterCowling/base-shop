import sgMail from "@sendgrid/mail";
import { coreEnv } from "@acme/config/env/core";
import type { CampaignOptions } from "../send";
import { ProviderError } from "./types";
import type { CampaignProvider } from "./types";

export class SendgridProvider implements CampaignProvider {
  constructor() {
    if (coreEnv.SENDGRID_API_KEY) {
      sgMail.setApiKey(coreEnv.SENDGRID_API_KEY);
    }
  }

  async send(options: CampaignOptions): Promise<void> {
    try {
      await sgMail.send({
        to: options.to,
        from: coreEnv.CAMPAIGN_FROM || "no-reply@example.com",
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
