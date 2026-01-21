export type HookPayload = {
    campaign: string;
};
export type HookHandler = (shop: string, payload: HookPayload) => void | Promise<void>;
/**
 * Register a listener that runs whenever an email is sent.
 *
 * @param listener - Handler invoked with the shop ID and payload.
 *
 * @example
 * ```ts
 * onSend(async (shop, payload) => {
 *   console.info(`Email sent for ${shop}`, payload);
 * });
 * ```
 */
export declare function onSend(listener: HookHandler): void;
/**
 * Register a listener that runs when an email is opened.
 *
 * @param listener - Handler invoked with the shop ID and payload.
 *
 * @example
 * ```ts
 * onOpen(async (shop, payload) => {
 *   console.info(`Email opened for ${shop}`, payload);
 * });
 * ```
 */
export declare function onOpen(listener: HookHandler): void;
/**
 * Register a listener that runs when a link in an email is clicked.
 *
 * @param listener - Handler invoked with the shop ID and payload.
 *
 * @example
 * ```ts
 * onClick(async (shop, payload) => {
 *   console.info(`Email link clicked for ${shop}`, payload);
 * });
 * ```
 */
export declare function onClick(listener: HookHandler): void;
/**
 * Trigger all registered send listeners.
 *
 * @param shop - Identifier for the shop.
 * @param payload - Context about the email campaign.
 * @returns A promise that resolves once every listener has completed.
 *
 * @example
 * ```ts
 * await emitSend("my-shop", { campaign: "spring" });
 * ```
 */
export declare function emitSend(shop: string, payload: HookPayload): Promise<void>;
/**
 * Trigger all registered open listeners.
 *
 * @param shop - Identifier for the shop.
 * @param payload - Context about the email campaign.
 * @returns A promise that resolves once every listener has completed.
 *
 * @example
 * ```ts
 * await emitOpen("my-shop", { campaign: "spring" });
 * ```
 */
export declare function emitOpen(shop: string, payload: HookPayload): Promise<void>;
/**
 * Trigger all registered click listeners.
 *
 * @param shop - Identifier for the shop.
 * @param payload - Context about the email campaign.
 * @returns A promise that resolves once every listener has completed.
 *
 * @example
 * ```ts
 * await emitClick("my-shop", { campaign: "spring" });
 * ```
 */
export declare function emitClick(shop: string, payload: HookPayload): Promise<void>;
//# sourceMappingURL=hooks.d.ts.map