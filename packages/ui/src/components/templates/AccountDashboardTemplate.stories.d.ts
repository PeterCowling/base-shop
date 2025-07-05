import { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { type AccountDashboardTemplateProps } from "./AccountDashboardTemplate";
interface OrderRow {
    id: number;
    total: string;
}
declare const DashboardForOrders: React.FC<AccountDashboardTemplateProps<OrderRow>>;
declare const meta: Meta<typeof DashboardForOrders>;
export default meta;
export declare const Default: StoryObj<typeof DashboardForOrders>;
//# sourceMappingURL=AccountDashboardTemplate.stories.d.ts.map