// packages/ui/utils/cn.ts
/**
 * Concatenate truthy class names – identical to the helper used in shadcn/ui.
 */
export function cn(...classes) {
    return classes.filter(Boolean).join(" ");
}
