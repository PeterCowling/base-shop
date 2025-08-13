import sgMail from "@sendgrid/mail";
import { coreEnv } from "@acme/config/env/core";
import type { CampaignOptions } from "../send";
import type { CampaignProvider } from "./types";

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

  async createContact(email: string): Promise<string> {
    await sgMail.client.request({
      method: "PUT",
      url: "/v3/marketing/contacts",
      body: { contacts: [{ email }] },
    });
    const [, body] = await sgMail.client.request({
      method: "POST",
      url: "/v3/marketing/contacts/search",
      body: { query: `email LIKE '${email}'` },
    });
    return (body.result?.[0]?.id ?? body.results?.[0]?.id) as string;
  }

  async addToList(email: string, listId: string): Promise<void> {
    await sgMail.client.request({
      method: "PUT",
      url: "/v3/marketing/contacts",
      body: { list_ids: [listId], contacts: [{ email }] },
    });
  }

  async listSegments(id: string): Promise<string[]> {
    const [, body] = await sgMail.client.request({
      method: "GET",
      url: `/v3/marketing/segments/${id}/contacts`,
    });
    const list = body.result || body.results || body.contacts || [];
    return Array.isArray(list)
      ? (list as any[]).map((c) => c.email).filter(Boolean)
      : [];
  }
}
