/** Command line options for creating a shop. */
export interface Options {
    type: "sale" | "rental";
    theme: string;
    template: string;
    payment: string[];
    shipping: string[];
    name?: string;
    logo?: string;
    contactInfo?: string;
    enableSubscriptions?: boolean;
}
/**
 * Parse command line arguments for the create-shop script.
 * Returns the shop id, parsed options and flags indicating whether
 * theme or template were explicitly provided.
 */
export declare function parseArgs(argv: string[]): {
    shopId: string;
    options: Options;
    themeProvided: boolean;
    templateProvided: boolean;
};
