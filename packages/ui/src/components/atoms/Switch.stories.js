import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Switch } from "./Switch";
const meta = {
    title: "Atoms/Switch",
    component: Switch,
};
export default meta;
export const Uncontrolled = {};
const ControlledRender = () => {
    const [checked, setChecked] = useState(false);
    return _jsx(Switch, { checked: checked, onChange: () => setChecked(!checked) });
};
export const Controlled = {
    render: () => _jsx(ControlledRender, {}),
};
