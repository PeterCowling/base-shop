import type { ReverseLogisticsEvent } from "@acme/types";
export declare function createReverseLogisticsEventDelegate(): {
    create({ data }: {
        data: ReverseLogisticsEvent;
    }): Promise<ReverseLogisticsEvent>;
    createMany({ data }: {
        data: ReverseLogisticsEvent[];
    }): Promise<{
        count: number;
    }>;
    findMany({ where }?: {
        where?: Partial<ReverseLogisticsEvent>;
    }): Promise<ReverseLogisticsEvent[]>;
};
