// packages/ui/components/ui/table.tsx
import { cn } from "../utils/cn"; // tiny helper to merge classNames
/**
 * Basic, unopinionated table primitives (shadcn-ui style).
 * Each component forwards props / className so you can style with Tailwind.
 */
export function Table({ className, ...props }) {
    return (<div className="w-full overflow-x-auto">
      <table className={cn("w-full text-left text-sm text-foreground", className)} {...props}/>
    </div>);
}
export function TableHeader({ className, ...props }) {
    return <thead className={cn("border-b bg-muted/50", className)} {...props}/>;
}
export function TableBody({ className, ...props }) {
    return <tbody className={cn(className)} {...props}/>;
}
export function TableRow({ className, ...props }) {
    return (<tr className={cn("border-b transition-colors hover:bg-muted/25 data-[state=selected]:bg-muted", className)} {...props}/>);
}
export function TableHead({ className, ...props }) {
    return (<th className={cn("px-4 py-2 font-semibold text-foreground", className)} {...props}/>);
}
export function TableCell({ className, ...props }) {
    return <td className={cn("px-4 py-2 align-middle", className)} {...props}/>;
}
