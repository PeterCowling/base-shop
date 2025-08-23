export declare function createReturnLabel(_sessionId: string): Promise<{
    trackingNumber: string;
    labelUrl: string;
}>;
export declare function getStatus(tracking: string): Promise<string | null>;
