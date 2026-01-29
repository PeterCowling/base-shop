/**
 * Markdown rendering component for Business OS documents
 *
 * Renders markdown content with proper styling and anchor links
 */

"use client";

import ReactMarkdown from "react-markdown";
import rehypeSlug from "rehype-slug";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Renders markdown content with GitHub-flavored styling
 */
export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-slate max-w-none ${className}`}>
      <ReactMarkdown
        rehypePlugins={[rehypeSlug]}
        components={{
          // Custom heading renderer with anchor links
          h1: ({ children, id }) => (
            <h1 id={id} className="scroll-mt-20">
              {children}
            </h1>
          ),
          h2: ({ children, id }) => (
            <h2 id={id} className="scroll-mt-20">
              {children}
            </h2>
          ),
          h3: ({ children, id }) => (
            <h3 id={id} className="scroll-mt-20">
              {children}
            </h3>
          ),
          h4: ({ children, id }) => (
            <h4 id={id} className="scroll-mt-20">
              {children}
            </h4>
          ),
          // Custom link renderer with proper styling
          a: ({ href, children }) => (
            <a
              href={href}
              className="inline-flex min-h-11 min-w-11 items-center px-1 text-link underline"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={
                href?.startsWith("http")
                  ? // i18n-exempt -- BOS-102 security rel attribute [ttl=2026-03-31]
                    "noopener noreferrer"
                  : undefined
              }
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
