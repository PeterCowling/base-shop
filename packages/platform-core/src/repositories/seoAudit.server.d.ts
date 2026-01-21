import "server-only";

export interface SeoAuditEntry {
    timestamp: string;
    score: number;
    recommendations?: string[];
}
export declare function readSeoAudits(shop: string): Promise<SeoAuditEntry[]>;
export declare function appendSeoAudit(shop: string, entry: SeoAuditEntry): Promise<void>;
