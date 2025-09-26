"use client";
import * as React from "react";
import { cn } from "../../utils/style";

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
  const [open, setOpen] = React.useState(true);
  if (!open || !text) return null;

  const content = (
    <div
      className={cn(
        "flex w-full items-center justify-center gap-2 bg-primary px-4 py-2 text-sm",
        className,
      )}
      data-token="--color-primary"
      {...props}
    >
      <span className="text-primary-foreground" data-token="--color-primary-fg">
        {text}
      </span>
      {closable && (
        <button
          type="button"
          aria-label="Close announcement"
          onClick={() => setOpen(false)}
          className="ms-2 text-primary-foreground/70 hover:text-primary-foreground"
          data-token="--color-primary-fg"
        >
          &times;
        </button>
      )}
    </div>
  );

  return href ? (
    <a href={href} className="block w-full">
      {content}
    </a>
  ) : (
    content
  );
}
