export declare function getTrackingStatus(tracking: string): Promise<{
    status: string | null;
    steps: {
        label: string;
        date?: string;
        complete?: boolean;
    }[];
}>;

