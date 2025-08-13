import { Resend } from "resend";
import { coreEnv } from "@acme/config/env/core";
import type { CampaignOptions } from "../send";
import { ProviderError } from "./types";
import type { CampaignProvider } from "./types";
import { mapResendStats, type CampaignStats } from "../analytics";

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
}
