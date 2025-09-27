"use client";

import type { Locale } from "@acme/i18n/locales";
import { Button as UIButton } from "../../atoms/shadcn";
import type { ButtonProps as UIButtonProps } from "../../atoms/shadcn/Button";
import type { MouseEvent } from "react";
import type { InlineTextApi } from "./useInlineText";

type ButtonBlock = { label?: string; href?: string; variant?: string; size?: "sm" | "md" | "lg" | string };
type InlineEditor = InlineTextApi<ButtonBlock, "label">;

export default function InlineEditableButton({
  component,
  locale,
  inline,
  onCommit,
}: {
  component: ButtonBlock;
  locale: Locale; // kept for parity with Block API, not used
  inline: InlineEditor;
  onCommit: (patch: Record<string, unknown>) => void;
}) {
  void locale;
  // i18n-exempt — editor-only default label
  const t = (s: string) => s;
  const label = (component.label as string | undefined) ?? t("Button");
  const href = (component.href as string | undefined) ?? "#";
  const variant = (component.variant ?? "default") as UIButtonProps["variant"];
  const size = component.size ?? "md";

  if (!inline) return null;

  // i18n-exempt: class names
  const sizeClass =
    size === "sm"
      ? "px-2 py-1 text-sm" // i18n-exempt: class names
      : size === "lg"
      ? "px-6 py-3 text-lg" // i18n-exempt: class names
      : "px-4 py-2"; // i18n-exempt: class names

  return (
    <UIButton
      asChild
      variant={variant}
      className={sizeClass}
    >
      <a href={href} onClick={(e: MouseEvent) => e.preventDefault()}>
        <span
          {...inline.bind}
          role="textbox"
          aria-label={t("Edit button label")}
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
