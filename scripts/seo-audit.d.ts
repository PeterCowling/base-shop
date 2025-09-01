export interface SeoAuditResult {
    score: number;
    recommendations: string[];
}
/**
 * Run a Lighthouse SEO audit for the given URL and return the score and
 * recommendations for failing audits.
 */
export declare function runSeoAudit(url: string): Promise<SeoAuditResult>;
//# sourceMappingURL=seo-audit.d.ts.map