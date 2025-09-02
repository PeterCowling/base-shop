import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { MarketingEmailTemplate } from "./MarketingEmailTemplate";
export const marketingEmailTemplates = [
    {
        id: "basic",
        label: "Basic",
        buildSubject: (headline) => headline,
        make: (props) => (!props || !props.headline || props.content == null
            ? _jsx(_Fragment, {})
            : _jsx(MarketingEmailTemplate, { ...props })),
    },
    {
        id: "centered",
        label: "Centered",
        buildSubject: (headline) => headline,
        make: (props) => (!props || !props.headline || props.content == null
            ? _jsx(_Fragment, {})
            : _jsx(MarketingEmailTemplate, { ...props, className: "text-center" })),
    },
];
