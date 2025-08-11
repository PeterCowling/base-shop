// packages/ui/src/components/cms/blocks/CustomHtml.tsx
"use client";

import DOMPurify from "dompurify";

interface Props {
  /** Raw HTML content to render */
  html?: string;
}

/** Safely renders provided HTML after sanitization */
export default function CustomHtml({ html }: Props) {
  if (!html) return null;
  const sanitized = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

