import { jsx as _jsx } from "react/jsx-runtime";
import DOMPurify from "dompurify";
import { memo } from "react";
function CustomHtml({ html }) {
    if (!html)
        return null;
    const sanitized = DOMPurify.sanitize(html);
    return _jsx("div", { dangerouslySetInnerHTML: { __html: sanitized } });
}
export default memo(CustomHtml);
