import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "../../atoms/shadcn";
import useComponentInputs from "./useComponentInputs";
export default function SocialLinksEditor({ component, onChange }) {
    const { handleInput } = useComponentInputs(onChange);
    return (_jsxs(_Fragment, { children: [_jsx(Input, { label: "Facebook URL", value: component.facebook ?? "", onChange: (e) => handleInput("facebook", e.target.value) }), _jsx(Input, { label: "Instagram URL", value: component.instagram ?? "", onChange: (e) => handleInput("instagram", e.target.value) }), _jsx(Input, { label: "X URL", value: component.x ?? "", onChange: (e) => handleInput("x", e.target.value) }), _jsx(Input, { label: "YouTube URL", value: component.youtube ?? "", onChange: (e) => handleInput("youtube", e.target.value) }), _jsx(Input, { label: "LinkedIn URL", value: component.linkedin ?? "", onChange: (e) => handleInput("linkedin", e.target.value) })] }));
}
