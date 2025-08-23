import { Resend } from "resend";
import { coreEnv } from "@acme/config/env/core";
import { ProviderError } from "./types";
import { mapResendStats, } from "../analytics";
import { getDefaultSender } from "../config";
export class ResendProvider {
    client;
    /** Promise resolving when optional credential checks finish. */
    ready;
    constructor(options = {}) {
        this.client = new Resend(coreEnv.RESEND_API_KEY || "");
        if (options.sanityCheck && coreEnv.RESEND_API_KEY) {
            this.ready = fetch("https://api.resend.com/domains", {
                headers: {
                    Authorization: `Bearer ${coreEnv.RESEND_API_KEY}`,
                },
            }).then((res) => {
                if (!res.ok) {
                    throw new Error(`Resend credentials rejected with status ${res.status}`);
                }
            });
        }
        else {
            this.ready = Promise.resolve();
        }
    }
    async send(options) {
        try {
            await this.client.emails.send({
                from: getDefaultSender(),
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text ?? "",
            });
        }
        catch (error) {
            if (error && typeof error === "object" && "message" in error) {
                const err = error;
                console.error("Campaign email send failed", {
                    provider: "resend",
                    recipient: options.to,
                    campaignId: options.campaignId,
                    error: err,
                });
                const status = err.code ?? err.response?.statusCode ?? err.statusCode;
                const retryable = typeof status !== "number" || status >= 500;
                throw new ProviderError(err.message, retryable);
            }
            console.error("Campaign email send failed", {
                provider: "resend",
                recipient: options.to,
                campaignId: options.campaignId,
            });
            throw new ProviderError("Unknown error", true);
        }
    }
    async getCampaignStats(id) {
        try {
            const res = await fetch(`https://api.resend.com/campaigns/${id}/stats`, {
                headers: {
                    Authorization: `Bearer ${coreEnv.RESEND_API_KEY || ""}`,
                },
            });
            const json = await res
                .json()
                .catch(() => ({}));
            return mapResendStats(json);
        }
        catch {
            return mapResendStats({});
        }
    }
    async createContact(email) {
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
        }
        catch {
            return "";
        }
    }
    async addToList(contactId, listId) {
        await fetch(`https://api.resend.com/segments/${listId}/contacts`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${coreEnv.RESEND_API_KEY || ""}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ contact_id: contactId }),
        }).catch(() => undefined);
    }
    async listSegments() {
        try {
            const res = await fetch("https://api.resend.com/segments", {
                headers: { Authorization: `Bearer ${coreEnv.RESEND_API_KEY || ""}` },
            });
            const json = await res
                .json()
                .catch(() => ({}));
            const segments = Array.isArray(json?.data ?? json?.segments)
                ? (json.data ?? json.segments)
                : [];
            return segments.map((s) => ({ id: s.id, name: s.name }));
        }
        catch {
            return [];
        }
    }
}
