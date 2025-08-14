import { Resend } from "resend";
import { coreEnv } from "@acme/config/env/core";
import type { CampaignOptions } from "../send";
import { ProviderError } from "./types";
import type { CampaignProvider } from "./types";
import {
  mapResendStats,
  type CampaignStats,
  type ResendStatsResponse,
} from "../analytics";
import { getDefaultSender } from "../config";

interface ProviderOptions {
  /**
    * When true, perform a lightweight API request to verify credentials. The
    * request result can be awaited via the `ready` promise.  Failure to
    * authenticate will reject the promise with a descriptive error.
    */
  sanityCheck?: boolean;
}

export class ResendProvider implements CampaignProvider {
  private client: Resend;
  /** Promise resolving when optional credential checks finish. */
  readonly ready: Promise<void>;

  constructor(options: ProviderOptions = {}) {
    this.client = new Resend(coreEnv.RESEND_API_KEY || "");

    if (options.sanityCheck && coreEnv.RESEND_API_KEY) {
      this.ready = fetch("https://api.resend.com/domains", {
        headers: {
          Authorization: `Bearer ${coreEnv.RESEND_API_KEY}`,
        },
      }).then((res) => {
        if (!res.ok) {
          throw new Error(
            `Resend credentials rejected with status ${res.status}`
          );
        }
      });
    } else {
      this.ready = Promise.resolve();
    }
  }

  async send(options: CampaignOptions): Promise<void> {
    try {
      await this.client.emails.send({
        from: getDefaultSender(),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Campaign email send failed", {
          provider: "resend",
          recipient: options.to,
          campaignId: options.campaignId,
          error,
        });
        const status =
          (error as any)?.code ??
          (error as any)?.response?.statusCode ??
          (error as any)?.statusCode;
        const retryable = typeof status !== "number" || status >= 500;
        throw new ProviderError(error.message, retryable);
      }
      console.error("Campaign email send failed", {
        provider: "resend",
        recipient: options.to,
        campaignId: options.campaignId,
      });
      throw new ProviderError("Unknown error", true);
    }
  }

  async getCampaignStats(id: string): Promise<CampaignStats> {
    try {
      const res = await fetch(`https://api.resend.com/campaigns/${id}/stats`, {
        headers: {
          Authorization: `Bearer ${coreEnv.RESEND_API_KEY || ""}`,
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
