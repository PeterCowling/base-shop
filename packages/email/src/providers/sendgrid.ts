import sgMail from "@sendgrid/mail";
import { coreEnv } from "@acme/config/env/core";
import type { CampaignOptions } from "../send";
import type { CampaignProvider } from "./types";
import { mapSendGridStats, type CampaignStats } from "../analytics";

export class SendgridProvider implements CampaignProvider {
  constructor() {
    if (coreEnv.SENDGRID_API_KEY) {
      sgMail.setApiKey(coreEnv.SENDGRID_API_KEY);
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

  async getCampaignStats(id: string): Promise<CampaignStats> {
    if (!coreEnv.SENDGRID_API_KEY) return mapSendGridStats({});
    try {
      const res = await fetch(
        `https://api.sendgrid.com/v3/campaigns/${id}/stats`,
        {
          headers: {
            Authorization: `Bearer ${coreEnv.SENDGRID_API_KEY}`,
          },
        }
      );
      const json = await res.json().catch(() => ({}));
      return mapSendGridStats(json);
    } catch {
      return mapSendGridStats({});
    }
  }
}
