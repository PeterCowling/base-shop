export type HookPayload = {
    campaign: string;
};
export type HookHandler = (shop: string, payload: HookPayload) => void | Promise<void>;
export declare function onSend(listener: HookHandler): void;
export declare function onOpen(listener: HookHandler): void;
export declare function onClick(listener: HookHandler): void;
export declare function emitSend(shop: string, payload: HookPayload): Promise<void>;
export declare function emitOpen(shop: string, payload: HookPayload): Promise<void>;
export declare function emitClick(shop: string, payload: HookPayload): Promise<void>;
//# sourceMappingURL=hooks.d.ts.map