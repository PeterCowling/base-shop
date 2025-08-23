import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";
export default function SocialFeedEditor({ component, onChange }) {
    const handleInput = (field, value) => {
        onChange({ [field]: value });
    };
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs(Select, { value: component.platform ?? "", onValueChange: (v) => handleInput("platform", v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "platform" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "twitter", children: "twitter" }), _jsx(SelectItem, { value: "instagram", children: "instagram" })] })] }), _jsx(Input, { value: component.account ?? "", onChange: (e) => handleInput("account", e.target.value), placeholder: "account" }), _jsx(Input, { value: component.hashtag ?? "", onChange: (e) => handleInput("hashtag", e.target.value), placeholder: "hashtag" })] }));
}
