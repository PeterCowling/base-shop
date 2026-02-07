import "server-only";

import { Resend } from "resend";

import { logger } from "@acme/lib/logger";

import { getDefaultSender } from "../config";
import type { CampaignOptions } from "../send";
import {
  type CampaignStats,
  mapResendStats,
  type ResendStatsResponse,
} from "../stats";

import type {
  CampaignProvider,
  ResendError,
  ResendSegment,
} from "./types";
import { ProviderError } from "./types";

const apiKey = process.env.RESEND_API_KEY;

interface ProviderOptions {
  /**
    * When true, perform a lightweight API request to verify credentials. The
    * request result can be awaited via the `ready` promise.  Failure to
    * authenticate will reject the promise with a descriptive error.
    */
  sanityCheck?: boolean;
}

export class ResendProvider implements CampaignProvider {
  private client?: Resend;
  /** Promise resolving when optional credential checks finish. */
  readonly ready: Promise<void>;

  constructor(options: ProviderOptions = {}) {
    if (apiKey) {
      this.client = new Resend(apiKey);

      if (options.sanityCheck) {
        this.ready = fetch("https://api.resend.com/domains", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }).then((res) => {
          if (!res.ok) {
            throw new Error(
              `Resend credentials rejected with status ${res.status}`
            ); // i18n-exempt: developer configuration error
          }
        });
      } else {
        this.ready = Promise.resolve();
      }
    } else {
      this.ready = Promise.resolve();
    }
  }

  async send(options: CampaignOptions): Promise<void> {
    if (!this.client) {
      logger.warn("Resend API key is not configured; skipping email send", { // i18n-exempt: operational log
        provider: "resend",
        recipient: options.to,
        campaignId: options.campaignId,
      });
      return;
    }
    try {
      await this.client.emails.send({
        from: getDefaultSender(),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text ?? "",
      });
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        const err = error as ResendError;
        logger.error("Campaign email send failed", { // i18n-exempt: operational log
          provider: "resend",
          recipient: options.to,
          campaignId: options.campaignId,
          error: err,
        });
        const status =
          err.code ??
          err.response?.statusCode ??
          err.statusCode ??
          (typeof err.status !== "undefined" ? err.status : undefined);
        const numericStatus =
          typeof status === "string" ? parseInt(status, 10) : status;
        const retryable =
          typeof numericStatus !== "number" || numericStatus >= 500;
        throw new ProviderError(err.message, retryable);
      }
      logger.error("Campaign email send failed", { // i18n-exempt: operational log
        provider: "resend",
        recipient: options.to,
        campaignId: options.campaignId,
      });
      throw new ProviderError("Unknown error", true); // i18n-exempt: internal error tag
    }
  }

  async getCampaignStats(id: string): Promise<CampaignStats> {
    if (!apiKey) return mapResendStats({});
    try {
      const res = await fetch(`https://api.resend.com/campaigns/${id}/stats`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      const json: ResendStatsResponse = await res
        .json()
        .catch(() => ({} as ResendStatsResponse));
      return mapResendStats(json);
    } catch {
      return mapResendStats({});
    }
  }

  async createContact(email: string): Promise<string> {
    if (!apiKey) return "";
    try {
      const res = await fetch("https://api.resend.com/contacts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
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
    if (!apiKey) return;
    await fetch(`https://api.resend.com/segments/${listId}/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contact_id: contactId }),
    }).catch(() => undefined);
  }

  async listSegments(): Promise<{ id: string; name?: string }[]> {
    if (!apiKey) return [];
    try {
      const res = await fetch("https://api.resend.com/segments", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const json: {
        data?: ResendSegment[];
        segments?: ResendSegment[];
      } = await res
        .json()
        .catch(() => ({} as { data?: ResendSegment[]; segments?: ResendSegment[] }));
      const segments = Array.isArray(json?.data ?? json?.segments)
        ? (json.data ?? json.segments)!
        : [];
      return segments.map((s: ResendSegment) => ({ id: s.id, name: s.name }));
    } catch {
      return [];
    }
  }
}
