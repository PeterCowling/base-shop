import { Resend } from "resend";
import { coreEnv } from "@acme/config/env/core";
import type { CampaignOptions } from "../send";
import type { CampaignProvider } from "./types";

export class ResendProvider implements CampaignProvider {
  private client: Resend;

  constructor() {
    this.client = new Resend(coreEnv.RESEND_API_KEY || "");
  }

  async send(options: CampaignOptions): Promise<void> {
    await this.client.emails.send({
      from: coreEnv.CAMPAIGN_FROM || "no-reply@example.com",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }

  async createContact(email: string): Promise<string> {
    const res = await this.client.contacts.create({ email });
    return res.data?.id ?? "";
  }

  async addToList(email: string, listId: string): Promise<void> {
    await this.client.contacts.update({ id: email, audienceId: listId });
  }

  async listSegments(id: string): Promise<string[]> {
    const res = await this.client.contacts.list({ audienceId: id });
    return res.data?.data?.map((c: any) => c.email) ?? [];
  }
}
