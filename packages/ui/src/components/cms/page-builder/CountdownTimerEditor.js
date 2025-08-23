import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "../../atoms/shadcn";
import useComponentInputs from "./useComponentInputs";
export default function CountdownTimerEditor({ component, onChange }) {
    const { handleInput } = useComponentInputs(onChange);
    return (_jsxs(_Fragment, { children: [_jsx(Input, { label: "Target Date", type: "datetime-local", value: component.targetDate ?? "", onChange: (e) => handleInput("targetDate", e.target.value) }), _jsx(Input, { label: "Timezone", value: component.timezone ?? "", onChange: (e) => handleInput("timezone", e.target.value) }), _jsx(Input, { label: "Completion Text", value: component.completionText ?? "", onChange: (e) => handleInput("completionText", e.target.value) }), _jsx(Input, { label: "Styles", value: component.styles ?? "", onChange: (e) => handleInput("styles", e.target.value) })] }));
}
