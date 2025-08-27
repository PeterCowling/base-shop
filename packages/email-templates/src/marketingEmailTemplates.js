import { jsx as _jsx } from "react/jsx-runtime";
import { MarketingEmailTemplate } from "./MarketingEmailTemplate";
export const marketingEmailTemplates = [
    {
        id: "basic",
        name: "Basic",
        render: (props) => _jsx(MarketingEmailTemplate, { ...props }),
    },
    {
        id: "centered",
        name: "Centered",
        render: (props) => (_jsx(MarketingEmailTemplate, { ...props, className: "text-center" })),
    },
];
