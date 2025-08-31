import { jsx as _jsx } from "react/jsx-runtime";
import { MarketingEmailTemplate } from "./MarketingEmailTemplate";
export const marketingEmailTemplates = [
    {
        id: "basic",
        label: "Basic",
        buildSubject: (headline) => headline,
        make: (props) => _jsx(MarketingEmailTemplate, { ...props }),
    },
    {
        id: "centered",
        label: "Centered",
        buildSubject: (headline) => headline,
        make: (props) => (_jsx(MarketingEmailTemplate, { ...props, className: "text-center" })),
    },
];
