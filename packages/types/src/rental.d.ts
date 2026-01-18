export type RentalLineItem = {
    sku: string;
    start: string;
    end: string;
    durationUnit: "hour" | "day" | "week";
    locationId?: string;
    deposit?: number;
    insurance?: {
        selected: boolean;
        fee?: number;
    };
    termsVersion: string;
};
//# sourceMappingURL=rental.d.ts.map