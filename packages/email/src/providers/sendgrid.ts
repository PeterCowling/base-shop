import "server-only"; // i18n-exempt -- EMAIL-1000 [ttl=2026-03-31]

import sgMail from "@sendgrid/mail";

import { logger } from "@acme/lib/logger";

import { getDefaultSender } from "../config";
import type { CampaignOptions } from "../send";
import {
  type CampaignStats,
  mapSendGridStats,
  type SendGridStatsResponse,
} from "../stats";

import { hasProviderErrorFields } from "./error";
import type { CampaignProvider } from "./types";
import { ProviderError } from "./types";

const apiKey = process.env.SENDGRID_API_KEY;
const marketingKey = process.env.SENDGRID_MARKETING_KEY || apiKey;

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
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }

    if (options.sanityCheck && apiKey) {
      this.ready = fetch("https://api.sendgrid.com/v3/user/profile", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }).then((res) => {
        if (!res.ok) {
          throw new Error(
            `Sendgrid credentials rejected with status ${res.status}`
          ); // i18n-exempt -- EMAIL-1000 [ttl=2026-03-31]
        }
      });
    } else {
      this.ready = Promise.resolve();
    }
  }

  async send(options: CampaignOptions): Promise<void> {
    if (!apiKey) {
      logger.warn(
        "Sendgrid API key is not configured; attempting to send email", // i18n-exempt -- EMAIL-1000 [ttl=2026-03-31]
        {
          provider: "sendgrid",
          recipient: options.to,
          campaignId: options.campaignId,
        },
      );
    }
    try {
      await sgMail.send({
        to: options.to,
        from: getDefaultSender(),
        subject: options.subject,
        html: options.html,
        text: options.text ?? "",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error("Campaign email send failed", { // i18n-exempt -- EMAIL-1000 [ttl=2026-03-31]
          provider: "sendgrid",
          recipient: options.to,
          campaignId: options.campaignId,
          error,
        });
        let status: number | string | undefined;
        if (hasProviderErrorFields(error)) {
          status =
            error.code ??
            error.response?.statusCode ??
            error.statusCode ??
            error.status;
        }
        const numericStatus =
          typeof status === "string" ? parseInt(status, 10) : status;
        const retryable =
          typeof numericStatus !== "number" || numericStatus >= 500;
        throw new ProviderError(error.message, retryable);
      }
      logger.error("Campaign email send failed", { // i18n-exempt -- EMAIL-1000 [ttl=2026-03-31]
        provider: "sendgrid",
        recipient: options.to,
        campaignId: options.campaignId,
      });
      throw new ProviderError("Unknown error", true); // i18n-exempt -- EMAIL-1000 [ttl=2026-03-31]
    }
  }

  async getCampaignStats(id: string): Promise<CampaignStats> {
    if (!apiKey) return mapSendGridStats({});
    try {
      const res = await fetch(
        `https://api.sendgrid.com/v3/campaigns/${id}/stats`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
      const json: SendGridStatsResponse = await res
        .json()
        .catch(() => ({} as SendGridStatsResponse));
      return mapSendGridStats(json);
    } catch {
      return mapSendGridStats({});
    }
  }

  async createContact(email: string): Promise<string> {
    const key = marketingKey || apiKey;
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
    const key = marketingKey || apiKey;
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
    const key = marketingKey || apiKey;
    if (!key) return [];
    try {
      const res = await fetch("https://api.sendgrid.com/v3/marketing/segments", {
        headers: { Authorization: `Bearer ${key}` },
      });
      const json = await res.json().catch(() => ({}));
      const segments = Array.isArray(json?.result) ? json.result : [];
      return segments.map((s: { id: string; name?: string }) => ({
        id: s.id,
        name: s.name,
      }));
    } catch {
      return [];
    }
  }
}
