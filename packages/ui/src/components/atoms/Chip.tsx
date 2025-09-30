"use client";
import * as React from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { cn } from "../../utils/style";
import { Tag, TagProps } from "./Tag";
import { useTranslations } from "@acme/i18n";

export interface ChipProps extends TagProps {
  onRemove?: () => void;
}

export const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  ({ onRemove, children, className, ...props }, ref) => {
    const t = useTranslations();
    return (
      <Tag
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
          className,
        )}
        {...props}
      >
        {children}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={t("actions.remove") as string}
            className={
              // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
              "ms-1 focus:outline-none inline-flex items-center justify-center min-h-10 min-w-10"
            }
          >
            <Cross2Icon aria-hidden className="h-3.5 w-3.5" />
            <span className="sr-only">{t("actions.remove")}</span>
          </button>
        )}
      </Tag>
    );
  }
);
Chip.displayName = "Chip"; // i18n-exempt -- DS-1234 [ttl=2025-11-30] — component displayName, not user-facing
