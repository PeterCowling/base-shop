import { Resend } from "resend";
import { coreEnv } from "@acme/config/env/core";
import type { ResolvedCampaignOptions } from "../send";
import { ProviderError } from "./types";
import type { CampaignProvider } from "./types";
import { mapResendStats, type CampaignStats } from "../analytics";

export class ResendProvider implements CampaignProvider {
  private client: Resend;

  constructor() {
    this.client = new Resend(coreEnv.RESEND_API_KEY || "");
  }

  async send(options: ResolvedCampaignOptions): Promise<void> {
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

  async createContact(email: string): Promise<string> {
    try {
      const res = await fetch("https://api.resend.com/contacts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${coreEnv.RESEND_API_KEY || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      return json?.id || "";
    } catch {
      return "";
    }
  }

  async addToList(contactId: string, listId: string): Promise<void> {
    await fetch(`https://api.resend.com/segments/${listId}/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${coreEnv.RESEND_API_KEY || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contact_id: contactId }),
    }).catch(() => undefined);
  }

  async listSegments(): Promise<{ id: string; name?: string }[]> {
    try {
      const res = await fetch("https://api.resend.com/segments", {
        headers: { Authorization: `Bearer ${coreEnv.RESEND_API_KEY || ""}` },
      });
      const json = await res.json().catch(() => ({}));
      const segments = Array.isArray(json?.data ?? json?.segments)
        ? json.data ?? json.segments
        : [];
      return segments.map((s: any) => ({ id: s.id, name: s.name }));
    } catch {
      return [];
    }
  }
}
