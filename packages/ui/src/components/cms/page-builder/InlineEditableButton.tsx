"use client";

import type { Locale } from "@acme/i18n/locales";
import { Button as UIButton } from "../../atoms/shadcn";

export default function InlineEditableButton({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component,
  locale,
  inline,
  onCommit,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: any;
  locale: Locale; // kept for parity with Block API, not used
  inline: ReturnType<typeof import("./useInlineText").default<any, any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCommit: (patch: any) => void;
}) {
  void locale;
  const label = (component.label as string | undefined) ?? "Button";
  const href = (component.href as string | undefined) ?? "#";
  const variant = component.variant ?? "default";
  const size = component.size ?? "md";

  if (!inline) return null;

  return (
    <UIButton
      asChild
      variant={variant}
      className={
        size === "sm"
          ? "px-2 py-1 text-sm"
          : size === "lg"
          ? "px-6 py-3 text-lg"
          : "px-4 py-2"
      }
    >
      <a href={href} onClick={(e: React.MouseEvent) => e.preventDefault()}>
        <span
          {...inline.bind}
          role="textbox"
          aria-label="Edit button label"
          onClick={(e) => {
            e.stopPropagation();
            if (!inline.editing) inline.startEditing();
          }}
          onBlur={(e) => {
            e.stopPropagation();
            const patch = inline.finishEditing();
            onCommit(patch);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const patch = inline.finishEditing();
              onCommit(patch);
            }
          }}
        >
          {inline.value || label}
        </span>
      </a>
    </UIButton>
  );
}
