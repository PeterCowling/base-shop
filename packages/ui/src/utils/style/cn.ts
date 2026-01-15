import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const THEME_COLOR_TOKENS = [
  "bg",
  "fg",
  "background",
  "foreground",
  "surface-1",
  "surface-2",
  "surface-3",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "panel",
  "inset",
  "input",
  "border",
  "border-1",
  "border-2",
  "border-3",
  "muted",
  "muted-foreground",
  "primary",
  "primary-soft",
  "primary-foreground",
  "primary-fg",
  "accent",
  "accent-soft",
  "accent-foreground",
  "accent-fg",
  "danger",
  "danger-soft",
  "danger-foreground",
  "danger-fg",
  "destructive",
  "destructive-foreground",
  "success",
  "success-soft",
  "success-foreground",
  "success-fg",
  "warning",
  "warning-soft",
  "warning-foreground",
  "warning-fg",
  "info",
  "info-soft",
  "info-foreground",
  "info-fg",
  "link",
  "ring",
  "hero-foreground",
] as const;

const twMerge = extendTailwindMerge({
  extend: { theme: { colors: [...THEME_COLOR_TOKENS] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
