import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Radio } from "./Radio";
const meta = {
    title: "Atoms/Radio",
    component: Radio,
    argTypes: {
        selectedIndex: { control: { type: "inline-radio", options: [0, 1, 2] } },
    },
    args: { selectedIndex: 0 },
};
export default meta;
const GroupRender = (args) => {
    const [selected, setSelected] = useState(args.selectedIndex);
    return (_jsx("div", { className: "flex flex-col gap-2", children: ["One", "Two", "Three"].map((label, i) => (_jsx(Radio, { name: "group", label: label, checked: selected === i, onChange: () => setSelected(i) }, label))) }));
};
export const Group = {
    render: (args) => _jsx(GroupRender, { ...args }),
};
