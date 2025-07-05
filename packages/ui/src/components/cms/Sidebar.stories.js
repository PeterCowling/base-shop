import Sidebar from "./Sidebar.client";
const meta = {
    component: Sidebar,
    args: {
        role: "admin",
    },
    argTypes: {
        role: { control: "text" },
    },
};
export default meta;
export const Default = {};
