export type Availability = {
    available: boolean;
    blocks: string[];
    capacity?: number;
};
export type AvailabilityAdapter = {
    getAvailability: (sku: string, range: {
        start: string;
        end: string;
    }, locationId?: string) => Promise<Availability>;
};
export declare function configureAvailabilityAdapter(a: AvailabilityAdapter): void;
export declare function getAvailability(sku: string, range: {
    start: string;
    end: string;
}, locationId?: string): Promise<Availability>;
