import sgMail from "@sendgrid/mail";
import { coreEnv } from "@acme/config/env/core";
import type { CampaignOptions } from "../send";
import { ProviderError } from "./types";
import type { CampaignProvider } from "./types";
import { mapSendGridStats, type CampaignStats } from "../analytics";

interface ProviderOptions {
  /**
   * When true, the constructor will make a lightweight API request to verify
   * that the configured credentials are accepted by SendGrid.  The result of
   * this request can be awaited via the `ready` promise exposed on the
   * instance.  Consumers that do not wish to block on this check can ignore the
   * promise.
   */
  sanityCheck?: boolean;
}

export class SendgridProvider implements CampaignProvider {
  /**
   * Promise that resolves once optional credential checks complete.  If the
   * credentials are rejected, this promise rejects with a descriptive error.
   */
  readonly ready: Promise<void>;

  constructor(options: ProviderOptions = {}) {
    if (coreEnv.SENDGRID_API_KEY) {
      sgMail.setApiKey(coreEnv.SENDGRID_API_KEY);
    }

    if (options.sanityCheck && coreEnv.SENDGRID_API_KEY) {
      this.ready = fetch("https://api.sendgrid.com/v3/user/profile", {
        headers: {
          Authorization: `Bearer ${coreEnv.SENDGRID_API_KEY}`,
        },
      }).then((res) => {
        if (!res.ok) {
          throw new Error(
            `Sendgrid credentials rejected with status ${res.status}`
          );
        }
      });
    } else {
      this.ready = Promise.resolve();
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

  async getCampaignStats(id: string): Promise<CampaignStats> {
    const key =
      coreEnv.SENDGRID_MARKETING_KEY || coreEnv.SENDGRID_API_KEY;
    if (!key) return mapSendGridStats({});
    try {
      const res = await fetch(
        `https://api.sendgrid.com/v3/campaigns/${id}/stats`,
        {
          headers: {
            Authorization: `Bearer ${key}`,
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
    const key =
      coreEnv.SENDGRID_MARKETING_KEY || coreEnv.SENDGRID_API_KEY;
    if (!key) return "";
    try {
      const res = await fetch("https://api.sendgrid.com/v3/marketing/contacts", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${key}`,
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
    const key =
      coreEnv.SENDGRID_MARKETING_KEY || coreEnv.SENDGRID_API_KEY;
    if (!key) return;
    await fetch(`https://api.sendgrid.com/v3/marketing/lists/${listId}/contacts`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contact_ids: [contactId] }),
    }).catch(() => undefined);
  }

  async listSegments(): Promise<{ id: string; name?: string }[]> {
    const key =
      coreEnv.SENDGRID_MARKETING_KEY || coreEnv.SENDGRID_API_KEY;
    if (!key) return [];
    try {
      const res = await fetch("https://api.sendgrid.com/v3/marketing/segments", {
        headers: { Authorization: `Bearer ${key}` },
      });
      const json = await res.json().catch(() => ({}));
      const segments = Array.isArray(json?.result) ? json.result : [];
      return segments.map((s: any) => ({ id: s.id, name: s.name }));
    } catch {
      return [];
    }
  }
}
