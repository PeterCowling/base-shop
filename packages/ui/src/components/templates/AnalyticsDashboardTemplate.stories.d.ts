import { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { type AnalyticsDashboardProps } from "./AnalyticsDashboardTemplate";
interface Row {
    id: number;
    amount: number;
}
declare const AnalyticsForRows: React.FC<AnalyticsDashboardProps<Row>>;
declare const meta: Meta<typeof AnalyticsForRows>;
export default meta;
export declare const Default: StoryObj<typeof AnalyticsForRows>;
//# sourceMappingURL=AnalyticsDashboardTemplate.stories.d.ts.map