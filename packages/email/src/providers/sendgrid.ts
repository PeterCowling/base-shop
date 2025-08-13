import sgMail from "@sendgrid/mail";
import { coreEnv } from "@acme/config/env/core";
import type { CampaignOptions } from "../send";
import type { CampaignProvider } from "./types";

export class SendgridProvider implements CampaignProvider {
  private ready: Promise<void>;

  constructor() {
    if (coreEnv.SENDGRID_API_KEY) {
      sgMail.setApiKey(coreEnv.SENDGRID_API_KEY);
      this.ready = sgMail.client
        .request({ method: "GET", url: "/v3/scopes" })
        .then(() => undefined)
        .catch((err: any) => {
          throw new Error(
            `SendGrid API key validation failed: ${
              err.response?.body?.errors?.[0]?.message || err.message
            }`,
          );
        });
    } else {
      this.ready = Promise.resolve();
    }
  }

  async send(options: CampaignOptions): Promise<void> {
    await this.ready;
    await sgMail.send({
      to: options.to,
      from: coreEnv.CAMPAIGN_FROM || "no-reply@example.com",
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }
}
