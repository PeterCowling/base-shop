// packages/ui/utils/style/cn.ts
/**
 * Concatenate truthy class names – identical to the helper used in shadcn/ui.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
