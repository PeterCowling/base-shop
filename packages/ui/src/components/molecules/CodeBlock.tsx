"use client";

import { useEffect, useState } from "react";
import { Button } from "../atoms";
import { cn } from "../../utils/style";

export interface CodeBlockProps {
  code: string;
  className?: string;
  preClassName?: string;
  copyLabel?: string;
  copiedLabel?: string;
}

export default function CodeBlock({
  code,
  className,
  preClassName,
  copyLabel = "Copy",
  copiedLabel = "Copied",
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function handleCopy() {
    try {
      if (!navigator.clipboard?.writeText) {
        setCopied(false);
        return;
      }
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        onClick={handleCopy}
        className="absolute right-3 top-3 z-10 h-auto px-2 py-1 text-xs"
      >
        {copied ? copiedLabel : copyLabel}
      </Button>
      <pre
        className={cn(
          "bg-muted text-xs font-mono leading-relaxed overflow-x-auto rounded-md border border-border p-4 pr-16",
          preClassName,
        )}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

