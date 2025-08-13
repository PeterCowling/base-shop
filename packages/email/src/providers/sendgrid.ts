import sgMail from "@sendgrid/mail";
import { coreEnv } from "@acme/config/env/core";
import type { ResolvedCampaignOptions } from "../send";
import { ProviderError } from "./types";
import type { CampaignProvider } from "./types";
import { mapSendGridStats, type CampaignStats } from "../analytics";

export class SendgridProvider implements CampaignProvider {
  constructor() {
    if (coreEnv.SENDGRID_API_KEY) {
      sgMail.setApiKey(coreEnv.SENDGRID_API_KEY);
    }
  }

  async send(options: ResolvedCampaignOptions): Promise<void> {
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

  async createContact(email: string): Promise<string> {
    if (!coreEnv.SENDGRID_API_KEY) return "";
    try {
      const res = await fetch("https://api.sendgrid.com/v3/marketing/contacts", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${coreEnv.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contacts: [{ email }] }),
      });
      const json = await res.json().catch(() => ({}));
      const ids = json?.persisted_recipients;
      return Array.isArray(ids) ? ids[0] || "" : "";
    } catch {
      return "";
    }
  }

  async addToList(contactId: string, listId: string): Promise<void> {
    if (!coreEnv.SENDGRID_API_KEY) return;
    await fetch(`https://api.sendgrid.com/v3/marketing/lists/${listId}/contacts`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${coreEnv.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contact_ids: [contactId] }),
    }).catch(() => undefined);
  }

  async listSegments(): Promise<{ id: string; name?: string }[]> {
    if (!coreEnv.SENDGRID_API_KEY) return [];
    try {
      const res = await fetch("https://api.sendgrid.com/v3/marketing/segments", {
        headers: { Authorization: `Bearer ${coreEnv.SENDGRID_API_KEY}` },
      });
      const json = await res.json().catch(() => ({}));
      const segments = Array.isArray(json?.result) ? json.result : [];
      return segments.map((s: any) => ({ id: s.id, name: s.name }));
    } catch {
      return [];
    }
  }
}
