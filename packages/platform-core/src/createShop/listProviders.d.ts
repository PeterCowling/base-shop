/**
 * List available providers for a given category by combining built-in
 * providers with any plugins under packages/plugins that implement the
 * respective registration hook.
 */
export declare function listProviders(kind: "payment" | "shipping"): Promise<string[]>;
export default listProviders;
//# sourceMappingURL=listProviders.d.ts.map