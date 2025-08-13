import { Resend } from "resend";
import { coreEnv } from "@acme/config/env/core";
import type { CampaignOptions } from "../send";
import type { CampaignProvider } from "./types";

export class ResendProvider implements CampaignProvider {
  private client: Resend;
  private ready: Promise<void>;

  constructor() {
    this.client = new Resend(coreEnv.RESEND_API_KEY || "");
    this.ready = coreEnv.RESEND_API_KEY
      ? this.client.apiKeys
          .list()
          .then(({ error }) => {
            if (error) {
              throw new Error(
                `Resend API key validation failed: ${error.message}`,
              );
            }
          })
      : Promise.resolve();
  }

  async send(options: CampaignOptions): Promise<void> {
    await this.ready;
    await this.client.emails.send({
      from: coreEnv.CAMPAIGN_FROM || "no-reply@example.com",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }
}
