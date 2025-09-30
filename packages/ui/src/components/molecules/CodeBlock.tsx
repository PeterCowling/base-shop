"use client";

import { useEffect, useState } from "react";
import { Button } from "../atoms";
import { cn } from "../../utils/style";
import { useTranslations } from "@acme/i18n";
// i18n-exempt -- DS-1234 [ttl=2025-11-30]
const PRE_CLASSES = "bg-muted text-xs font-mono leading-relaxed overflow-x-auto rounded-md border border-border p-4 pe-16"; // i18n-exempt -- DS-1234 [ttl=2025-11-30]

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
  copyLabel,
  copiedLabel,
}: CodeBlockProps) {
  const t = useTranslations();
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
    <div className={className}>
      <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={handleCopy}
        className="absolute end-3 top-3 h-auto px-2 py-1 text-xs"
      >
        {copied ? (copiedLabel ?? (t("actions.copied") as string)) : (copyLabel ?? (t("actions.copy") as string))}
      </Button>
      { /* i18n-exempt -- DS-1234 [ttl=2025-11-30] */ }
      <pre
        className={cn(
          PRE_CLASSES,
          preClassName,
        )}
      >
        <code>{code}</code>
      </pre>
      </div>
    </div>
  );
}
