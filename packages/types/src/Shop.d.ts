export interface Shop {
    id: string;
    name: string;
    catalogFilters: string[];
    themeId: string;
    /** Mapping of design tokens to theme values */
    themeTokens: Record<string, string>;
    /** Mapping of logical filter keys to catalog attributes */
    filterMappings: Record<string, string>;
}
