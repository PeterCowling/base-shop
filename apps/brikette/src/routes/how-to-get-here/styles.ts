import clsx from "clsx";

export const HOW_TO_ROUTE_SEGMENT = "how-to-get-here";

const ogProperty = (...parts: string[]) => parts.join(":");

export const OG_TITLE_PROPERTY = ogProperty("og", "title");
export const OG_DESCRIPTION_PROPERTY = ogProperty("og", "description");
export const OG_LOCALE_PROPERTY = ogProperty("og", "locale");
export const OG_LOCALE_ALTERNATE_PROPERTY = ogProperty("og", "locale", "alternate");

export const SEA_HORSE_SHUTTLE_URL = "https://www.seahorsecarservice.com/en/shuttle";
export const HERO_IMAGE_SRC = "/img/directions/hostel-brikette-entrance-steps.png";
export const INTRO_INTRO_KEY = "intro";

export const externalLinkClass = [
  "inline-flex",
  "items-center",
  "gap-1",
  "font-medium",
  "text-brand-primary",
  "underline",
  "underline-offset-4",
  "decoration-brand-primary/60",
  "transition-colors",
  "hover:decoration-transparent",
  "focus:outline-none",
  "focus-visible:outline",
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-brand-primary",
  "dark:text-brand-secondary",
].join(" ");

export const anchorLinkClass = [
  "inline-flex",
  "items-center",
  "justify-center",
  "rounded-full",
  "border",
  "border-transparent",
  "bg-brand-outline/10",
  "px-4",
  "py-2",
  "text-sm",
  "font-medium",
  "text-brand-heading",
  "transition",
  "duration-150",
  "hover:bg-brand-outline/20",
  "focus:outline-none",
  "focus-visible:outline",
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-brand-primary",
  "dark:bg-brand-outline/10",
  "dark:text-brand-text",
].join(" ");

export const destinationLinkPillClass = [
  "group",
  "inline-flex",
  "w-full",
  "items-center",
  "rounded-2xl",
  "border",
  "border-brand-outline/20",
  "bg-brand-primary/5",
  "px-4",
  "py-3",
  "text-start",
  "text-base",
  "font-medium",
  "text-brand-heading",
  "shadow-sm",
  "transition",
  "duration-150",
  "hover:border-brand-primary/40",
  "hover:bg-brand-primary/10",
  "focus:outline-none",
  "focus-visible:outline",
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-brand-primary",
  "dark:border-brand-outline/30",
  "dark:bg-brand-surface/10",
  "dark:text-brand-text",
  "dark:hover:border-brand-secondary/40",
  "dark:hover:bg-brand-surface/20",
].join(" ");

const filterButtonBaseClass = [
  "inline-flex",
  "items-center",
  "gap-2",
  "rounded-full",
  "border",
  "min-h-10",
  "px-4",
  "py-2",
  "text-sm",
  "font-medium",
  "transition",
  "duration-150",
  "focus:outline-none",
  "focus-visible:outline",
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-brand-primary",
].join(" ");

const filterButtonActiveClass = [
  "border-brand-primary",
  "bg-brand-primary/20",
  "text-brand-primary",
  "ring-1",
  "ring-inset",
  "ring-brand-primary/40",
  "dark:border-brand-secondary",
  "dark:bg-brand-secondary/30",
  "dark:text-brand-text",
  "dark:ring-brand-secondary/40",
].join(" ");

const filterButtonInactiveClass = [
  "border-brand-outline/30",
  "bg-brand-surface",
  "text-brand-heading",
  "hover:border-brand-primary/40",
  "hover:bg-brand-primary/5",
  "dark:border-brand-outline/30",
  "dark:bg-brand-surface/40",
  "dark:text-brand-text",
  "dark:hover:border-brand-secondary/50",
  "dark:hover:bg-brand-surface/10",
].join(" ");

export const clearFiltersButtonClass = [
  "inline-flex",
  "items-center",
  "justify-center",
  "min-h-10",
  "rounded-full",
  "border",
  "border-transparent",
  "px-4",
  "text-sm",
  "font-medium",
  "text-brand-primary",
  "underline",
  "underline-offset-4",
  "transition",
  "hover:text-brand-primary/80",
  "focus:outline-none",
  "focus-visible:outline",
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-brand-primary",
  "dark:text-brand-secondary",
  "dark:hover:text-brand-secondary/80",
].join(" ");

export const transportBadgeClass = [
  "items-center",
  "gap-2",
  "rounded-full",
  "border",
  "border-brand-outline/10",
  "bg-brand-surface/80",
  "px-3",
  "py-2",
  "text-sm",
  "font-medium",
  "text-brand-heading",
  "shadow-sm",
  "backdrop-blur",
  "transition",
  "duration-150",
  "hover:border-brand-primary/40",
  "dark:border-brand-outline/30",
  "dark:bg-brand-surface/50",
  "dark:text-brand-text",
  "dark:hover:border-brand-secondary/40",
].join(" ");

export function getFilterButtonClass(isActive: boolean) {
  return clsx(filterButtonBaseClass, isActive ? filterButtonActiveClass : filterButtonInactiveClass);
}
