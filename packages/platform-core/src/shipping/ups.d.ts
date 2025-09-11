export declare function createReturnLabel(_sessionId: string): Promise<{
    trackingNumber: string;
    labelUrl: string;
}>;
export declare function getStatus(tracking: string): Promise<string | null>;
export declare function getTrackingStatus(tracking: string): Promise<{
    status: string | null;
    steps: {
        label: string;
        date?: string;
        complete?: boolean;
    }[];
}>;
