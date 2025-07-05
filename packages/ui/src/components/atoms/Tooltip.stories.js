import { jsx as _jsx } from "react/jsx-runtime";
import { Icon } from "./Icon";
import { Tooltip } from "./Tooltip";
const meta = {
    title: "Atoms/Tooltip",
    component: Tooltip,
    argTypes: { position: { control: "radio", options: ["top", "bottom"] } },
    args: { text: "Info", position: "top" },
};
export default meta;
export const Default = {
    render: (args) => (_jsx("div", { className: "mt-10 flex justify-center", children: _jsx(Tooltip, { text: args.text, className: args.position === "bottom"
                ? "flex flex-col-reverse items-center"
                : undefined, children: _jsx("button", { className: "border p-2", children: _jsx(Icon, { name: "heart", width: 16, height: 16 }) }) }) })),
};
