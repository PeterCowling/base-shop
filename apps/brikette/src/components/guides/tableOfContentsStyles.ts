// src/components/guides/tableOfContentsStyles.ts
export const navClasses = [
  "not-prose",
  "relative",
  "mb-6",
  "rounded-2xl",
  "border",
  "border-brand-outline/20",
  "bg-brand-surface/80",
  "p-5",
  "text-sm",
  "text-brand-heading",
  "shadow-sm",
  "lg:p-6",
  "dark:border-brand-outline/40",
  "dark:bg-brand-bg/80",
  "dark:text-brand-heading",
] as const;

export const headingWrapClasses = [
  "mb-4",
  "border-b",
  "border-brand-outline/20",
  "pb-2",
  "dark:border-brand-outline/40",
] as const;

export const headingClasses = [
  "text-base",
  "font-semibold",
  "text-brand-heading",
  "dark:text-brand-heading",
] as const;

export const gridClasses = ["mt-4", "gap-y-3", "gap-x-4", "md:grid-cols-2"] as const;

export const linkClasses = [
  "group",
  "relative",
  "w-full",
  "items-start",
  "gap-3",
  "rounded-xl",
  "border",
  "border-transparent",
  "bg-transparent",
  "px-3",
  "py-2",
  "text-left",
  "text-sm",
  "font-medium",
  "no-underline",
  "cursor-pointer",
  "transition",
  "duration-150",
  "ease-out",
  "hover:bg-warning-soft",
  "focus-visible:border-brand-primary/30",
  "focus-visible:bg-brand-surface",
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-brand-primary/50",
  "focus-visible:ring-offset-2",
  "focus-visible:ring-offset-brand-surface",
  "dark:focus-visible:border-brand-primary/40",
  "dark:focus-visible:bg-brand-surface/20",
  "dark:focus-visible:ring-brand-primary/60",
  "dark:focus-visible:ring-offset-brand-bg",
  "before:absolute",
  "before:start-0",
  "before:top-2",
  "before:bottom-2",
  "before:w-1",
  "before:rounded-full",
  "before:bg-brand-primary",
  "before:opacity-0",
  "before:transition",
  "before:duration-150",
  "min-h-11",
] as const;

export const inactiveLinkClasses = [
  "text-brand-heading",
  "hover:border-brand-outline/30",
  "hover:shadow-sm",
  "dark:text-brand-text",
  "dark:hover:border-brand-outline/50",
] as const;

export const currentLinkClasses = [
  "bg-brand-primary/10",
  "text-brand-primary",
  "shadow-sm",
  "border-brand-primary/30",
  "before:opacity-100",
  "dark:bg-brand-primary/20",
  "dark:text-brand-primary",
] as const;

export const indexClasses = [
  "inline-flex",
  "size-8",
  "flex-none",
  "items-center",
  "justify-center",
  "rounded-full",
  "bg-brand-primary/10",
  "text-xs",
  "font-semibold",
  "tracking-wider",
  "tabular-nums",
  "text-brand-primary",
  "transition",
  "duration-150",
  "group-hover:bg-brand-primary/20",
  "group-focus-visible:bg-brand-primary/20",
  "mt-0.5",
] as const;

export const currentIndexClasses = ["bg-brand-primary", "text-brand-surface"] as const;

export const labelClasses = [
  "flex-1",
  "font-semibold",
  "break-words",
  "leading-snug",
] as const;

export const chevronClasses = [
  "ml-2",
  "text-base",
  "transition",
  "duration-150",
  "ease-out",
  "group-hover:translate-x-0.5",
  "group-hover:text-brand-primary",
  "group-focus-visible:text-brand-primary",
  "dark:group-hover:text-brand-primary",
  "dark:group-focus-visible:text-brand-primary",
  "self-center",
] as const;

export const inactiveChevronClasses = ["text-brand-muted", "dark:text-brand-muted"] as const;

export const currentChevronClasses = ["text-brand-primary"] as const;
