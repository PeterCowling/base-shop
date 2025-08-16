export declare function createContact(email: string): Promise<string>;
export declare function addToList(contactId: string, listId: string): Promise<void>;
export declare function listSegments(): Promise<{
    id: string;
    name?: string;
}[]>;
/**
 * Resolve a segment identifier to a list of customer email addresses based on
 * stored segment definitions.
 */
export declare function resolveSegment(shop: string, id: string): Promise<string[]>;
