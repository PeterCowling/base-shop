import type { CampaignProvider } from "../providers/types";
export declare function createContact(email: string): Promise<string>;
export declare function addToList(contactId: string, listId: string): Promise<void>;
export declare function listSegments(): Promise<{
    id: string;
    name?: string;
}[]>;
//# sourceMappingURL=providers.d.ts.map
