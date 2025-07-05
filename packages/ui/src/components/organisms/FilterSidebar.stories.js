import { FilterSidebar } from "./FilterSidebar";
const meta = {
    component: FilterSidebar,
    args: {},
    argTypes: {
        onChange: { action: "onChange" },
        width: {
            control: { type: "text" },
            description: "Tailwind width class or pixel value",
        },
    },
};
export default meta;
export const Default = {};
