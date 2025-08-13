import sgMail from "@sendgrid/mail";
import { coreEnv } from "@acme/config/env/core";
import type { CampaignOptions } from "../send";
import type { CampaignProvider } from "./types";

export class SendgridProvider implements CampaignProvider {
  constructor() {
    const key = coreEnv.SENDGRID_MARKETING_KEY || coreEnv.SENDGRID_API_KEY;
    if (key) {
      sgMail.setApiKey(key);
    }
  }

  async send(options: CampaignOptions): Promise<void> {
    await sgMail.send({
      to: options.to,
      from: coreEnv.CAMPAIGN_FROM || "no-reply@example.com",
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }
}
