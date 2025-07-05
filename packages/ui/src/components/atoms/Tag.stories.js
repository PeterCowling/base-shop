import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Tag } from "./Tag";
const meta = {
    title: "Atoms/Tag",
    component: Tag,
};
export default meta;
export const Variants = {
    render: () => (_jsxs("div", { className: "flex gap-2", children: [_jsx(Tag, { children: "Default" }), _jsx(Tag, { variant: "success", children: "Success" }), _jsx(Tag, { variant: "warning", children: "Warning" }), _jsx(Tag, { variant: "destructive", children: "Destructive" })] })),
};
