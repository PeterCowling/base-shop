import { jsx as _jsx } from "react/jsx-runtime";
import { Textarea } from "../../atoms/shadcn";
import useComponentInputs from "./useComponentInputs";
export default function CustomHtmlEditor({ component, onChange }) {
    const { handleInput } = useComponentInputs(onChange);
    return (_jsx(Textarea, { label: "HTML", value: component.html ?? "", onChange: (e) => handleInput("html", e.target.value) }));
}
