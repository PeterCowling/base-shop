import "server-only";

import type { CampaignOptions } from "../send";
import { type CampaignStats } from "../stats";

import type { CampaignProvider } from "./types";

interface ProviderOptions {
    /**
      * When true, perform a lightweight API request to verify credentials. The
      * request result can be awaited via the `ready` promise.  Failure to
      * authenticate will reject the promise with a descriptive error.
      */
    sanityCheck?: boolean;
}
export declare class ResendProvider implements CampaignProvider {
    private client?;
    /** Promise resolving when optional credential checks finish. */
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
//# sourceMappingURL=resend.d.ts.map