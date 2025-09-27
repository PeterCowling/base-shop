"use client";
import * as React from "react";
import { cn } from "../../utils/style";
import { useTranslations } from "@acme/i18n";

export interface AnnouncementBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Message text displayed in the bar */
  text?: string;
  /** Optional URL the bar links to */
  href?: string;
  /** Whether to show a close button */
  closable?: boolean;
}

/**
 * Simple announcement bar that can display a message with an optional link
 * and close button. When `href` is provided the entire bar becomes a link.
 */
export default function AnnouncementBar({
  text,
  href,
  closable = false,
  className,
  ...props
}: AnnouncementBarProps) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(true);
  if (!open || !text) return null;

  const content = (
    <div
      className={cn(
        "flex w-full items-center justify-center gap-2 bg-primary px-4 py-2 text-sm min-h-10", // i18n-exempt: class names
        className,
      )}
      /* i18n-exempt */
      data-token="--color-primary"
      {...props}
    >
      {/* i18n-exempt: design token attribute and classes */}
      <span className="text-primary-foreground" data-token="--color-primary-fg">
        {text}
      </span>
      {closable && (
        <button
          type="button"
          aria-label={t("Close announcement") as string}
          onClick={() => setOpen(false)}
          className="ms-2 inline-flex min-h-10 min-w-10 items-center justify-center text-primary-foreground/70 hover:text-primary-foreground" // i18n-exempt: class names
          /* i18n-exempt */
          data-token="--color-primary-fg"
        >
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
