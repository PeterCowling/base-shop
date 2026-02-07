import "server-only";

import type { CampaignOptions } from "../send";
import { type CampaignStats } from "../stats";

import type { CampaignProvider } from "./types";

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
export declare class SendgridProvider implements CampaignProvider {
    /**
     * Promise that resolves once optional credential checks complete.  If the
     * credentials are rejected, this promise rejects with a descriptive error.
     */
    readonly ready: Promise<void>;
    constructor(options?: ProviderOptions);
    send(options: CampaignOptions): Promise<void>;
    getCampaignStats(id: string): Promise<CampaignStats>;
    createContact(email: string): Promise<string>;
    addToList(contactId: string, listId: string): Promise<void>;
    listSegments(): Promise<{
        id: string;
        name?: string;
    }[]>;
}
export {};
//# sourceMappingURL=sendgrid.d.ts.map