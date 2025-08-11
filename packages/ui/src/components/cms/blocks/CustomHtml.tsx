import DOMPurify from "dompurify";
import { memo } from "react";

interface CustomHtmlProps {
  html?: string;
}

function CustomHtml({ html }: CustomHtmlProps) {
  if (!html) return null;
  const sanitized = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

export default memo(CustomHtml);
