"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Checkbox } from "@acme/design-system/atoms";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="prose prose-sm w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Customize rendering for better styling
          h1: ({ children }) => (
            <h1 className="mb-4 mt-6 text-2xl font-bold text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-5 text-xl font-bold text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 text-lg font-semibold text-foreground">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-foreground">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 list-inside list-disc space-y-2 text-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-inside list-decimal space-y-2 text-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="ms-4">{children}</li>,
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
          code: ({ className, children }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-sm text-foreground">
                  {children}
                </code>
              );
            }
            return (
              <code className="block overflow-x-auto rounded bg-surface-2 p-4 font-mono text-sm text-foreground">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="mb-4">{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-4 border-border-2 pl-4 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          // Task list support (GFM)
          input: (props) => {
            const isCheckbox = props.type === "checkbox" || props.type === undefined;
            if (!isCheckbox) return <input {...props} />;

            return (
              <span className="me-2 inline-flex min-h-10 min-w-10 items-center justify-center">
                <Checkbox
                  checked={Boolean(props.checked)}
                  disabled
                  aria-hidden
                />
              </span>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
