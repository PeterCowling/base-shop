import { DashboardTemplate } from "./DashboardTemplate";
const meta = {
    component: DashboardTemplate,
    args: {
        stats: [
            { label: "Users", value: 1000 },
            { label: "Orders", value: 250 },
        ],
    },
    argTypes: {
        stats: { control: "object" },
    },
};
export default meta;
export const Default = {};
