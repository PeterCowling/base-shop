import { memo } from "react";
import DOMPurify from "dompurify";

export interface CustomHtmlProps {
  html?: string;
}

function CustomHtml({ html }: CustomHtmlProps) {
  if (!html) return null;
  const sanitized = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

export default memo(CustomHtml);
