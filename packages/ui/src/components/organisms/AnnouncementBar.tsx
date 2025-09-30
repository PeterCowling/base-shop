"use client"; // i18n-exempt -- PB-000 [ttl=2025-12-31]: Next.js directive string
import * as React from "react";
import { cn } from "../../utils/style";
import { useTranslations } from "@acme/i18n";
import type { TranslatableText } from "@acme/types/i18n";
import type { Locale } from "@acme/i18n/locales";
import { resolveText } from "@i18n/resolveText";

export interface AnnouncementBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Message text displayed in the bar */
  text?: TranslatableText;
  /** Optional URL the bar links to */
  href?: string;
  /** Whether to show a close button */
  closable?: boolean;
  /** Optional current locale used for inline values */
  locale?: Locale;
}

/**
 * Simple announcement bar that can display a message with an optional link
 * and close button. When `href` is provided the entire bar becomes a link.
 */
export default function AnnouncementBar({ text, href, closable = false, className, locale, ...props }: AnnouncementBarProps) {
  const t = useTranslations() as unknown as (key: string, params?: Record<string, unknown>) => string;
  const [open, setOpen] = React.useState(true);
  if (!open || !text) return null;

  const resolvedText = typeof text === "string" ? text : resolveText(text, (locale ?? "en") as Locale, t);
  if (!resolvedText) return null;

  const content = (
    <div
      className={cn(
        "flex w-full items-center justify-center gap-2 bg-primary px-4 py-2 text-sm min-h-10", // i18n-exempt -- PB-000 [ttl=2025-12-31]: CSS utility classes
        className,
      )}
      /* i18n-exempt -- PB-000 [ttl=2025-12-31]: design token attribute */
      data-token="--color-primary"
      {...props}
    >
      {/* i18n-exempt -- PB-000 [ttl=2025-12-31]: design token attribute and classes */}
      <span className="text-primary-foreground" data-token="--color-primary-fg">{resolvedText}</span>
      {closable && (
        <button
          type="button" /* i18n-exempt -- PB-000 [ttl=2025-12-31]: input/button type enum */
          aria-label={(() => {
            const label = (t("announcementBar.close") as unknown as string) ?? "";
            // Provide a sensible default in non-i18n test environments
            return label && label !== "announcementBar.close"
              ? label
              : "Close announcement";
          })()}
          onClick={() => setOpen(false)}
          className="ms-2 inline-flex min-h-10 min-w-10 items-center justify-center text-primary-foreground/70 hover:text-primary-foreground" // i18n-exempt -- PB-000 [ttl=2025-12-31]: CSS utility classes
          /* i18n-exempt -- PB-000 [ttl=2025-12-31]: design token attribute */
          data-token="--color-primary-fg"
        >
          {/* i18n-exempt -- PB-000 [ttl=2025-12-31]: decorative close glyph; accessible label provided */}
          &times;
        </button>
      )}
    </div>
  );

  return href ? (
    <a href={href} className="block w-full min-h-10 min-w-10">{/* i18n-exempt: class names */}
      {content}
    </a>
  ) : (
    content
  );
}
