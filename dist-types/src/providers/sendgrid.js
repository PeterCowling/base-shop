import sgMail from "@sendgrid/mail";
import { coreEnv } from "@acme/config/env/core";
import { ProviderError } from "./types";
import { hasProviderErrorFields } from "./error";
import { mapSendGridStats, } from "../analytics";
import { getDefaultSender } from "../config";
export class SendgridProvider {
    /**
     * Promise that resolves once optional credential checks complete.  If the
     * credentials are rejected, this promise rejects with a descriptive error.
     */
    ready;
    constructor(options = {}) {
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
                    throw new Error(`Sendgrid credentials rejected with status ${res.status}`);
                }
            });
        }
        else {
            this.ready = Promise.resolve();
        }
    }
    async send(options) {
        try {
            await sgMail.send({
                to: options.to,
                from: getDefaultSender(),
                subject: options.subject,
                html: options.html,
                text: options.text ?? "",
            });
        }
        catch (error) {
            if (error instanceof Error) {
                console.error("Campaign email send failed", {
                    provider: "sendgrid",
                    recipient: options.to,
                    campaignId: options.campaignId,
                    error,
                });
                const status = hasProviderErrorFields(error)
                    ? error.code ?? error.response?.statusCode ?? error.statusCode
                    : undefined;
                const retryable = typeof status !== "number" || status >= 500;
                throw new ProviderError(error.message, retryable);
            }
            console.error("Campaign email send failed", {
                provider: "sendgrid",
                recipient: options.to,
                campaignId: options.campaignId,
            });
            throw new ProviderError("Unknown error", true);
        }
    }
    async getCampaignStats(id) {
        if (!coreEnv.SENDGRID_API_KEY)
            return mapSendGridStats({});
        try {
            const res = await fetch(`https://api.sendgrid.com/v3/campaigns/${id}/stats`, {
                headers: {
                    Authorization: `Bearer ${coreEnv.SENDGRID_API_KEY}`,
                },
            });
            const json = await res
                .json()
                .catch(() => ({}));
            return mapSendGridStats(json);
        }
        catch {
            return mapSendGridStats({});
        }
    }
    async createContact(email) {
        const key = coreEnv.SENDGRID_MARKETING_KEY || coreEnv.SENDGRID_API_KEY;
        if (!key)
            return "";
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
        }
        catch {
            return "";
        }
    }
    async addToList(contactId, listId) {
        const key = coreEnv.SENDGRID_MARKETING_KEY || coreEnv.SENDGRID_API_KEY;
        if (!key)
            return;
        await fetch(`https://api.sendgrid.com/v3/marketing/lists/${listId}/contacts`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ contact_ids: [contactId] }),
        }).catch(() => undefined);
    }
    async listSegments() {
        const key = coreEnv.SENDGRID_MARKETING_KEY || coreEnv.SENDGRID_API_KEY;
        if (!key)
            return [];
        try {
            const res = await fetch("https://api.sendgrid.com/v3/marketing/segments", {
                headers: { Authorization: `Bearer ${key}` },
            });
            const json = await res.json().catch(() => ({}));
            const segments = Array.isArray(json?.result) ? json.result : [];
            return segments.map((s) => ({ id: s.id, name: s.name }));
        }
        catch {
            return [];
        }
    }
}
