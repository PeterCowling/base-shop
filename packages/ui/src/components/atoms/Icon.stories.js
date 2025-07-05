import { jsx as _jsx } from "react/jsx-runtime";
import { Icon } from "./Icon";
const meta = {
    title: "Atoms/Icon",
    component: Icon,
    argTypes: {
        name: { control: "radio", options: ["star", "heart", "user"] },
        size: { control: { type: "number", min: 12, max: 64 } },
    },
    args: { name: "heart", size: 24 },
};
export default meta;
export const Primary = {
    render: (args) => {
        const { size, ...rest } = args;
        return _jsx(Icon, { ...rest, width: size, height: size });
    },
};
