/** Resolve reminder delay for a shop (default: one day). */
export declare function resolveAbandonedCartDelay(shop: string, dataRoot?: string): Promise<number>;
export interface AbandonedCart {
    /** Customer's email address */
    email: string;
    /** Arbitrary cart payload */
    cart: unknown;
    /** Last time the cart was updated */
    updatedAt: number;
    /** Whether a reminder email has already been sent */
    reminded?: boolean;
}
/**
 * Send reminder emails for carts that have been inactive for at least a given delay.
 * Carts with `reminded` set to true are ignored. When an email is sent, the
 * record's `reminded` flag is set to true. Failures are ignored and returned
 * for optional retries or logging.
 */
export declare function recoverAbandonedCarts(carts: AbandonedCart[], now?: number, delayMs?: number): Promise<AbandonedCart[]>;
//# sourceMappingURL=abandonedCart.d.ts.map