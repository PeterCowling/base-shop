import * as React from "react";
import { cn } from "../../utils/cn";

export interface PopoverProps extends React.HTMLAttributes<HTMLDivElement> {
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  contentClassName?: string;
  children: React.ReactNode;
}

export const Popover = React.forwardRef<HTMLDivElement, PopoverProps>(
  (
    {
      trigger,
      children,
      open: openProp,
      onOpenChange,
      className,
      contentClassName,
      ...props
    },
    ref
  ) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
    const open = openProp ?? uncontrolledOpen;

    const toggle = () => {
      const newOpen = !open;
      if (openProp === undefined) setUncontrolledOpen(newOpen);
      onOpenChange?.(newOpen);
    };

    return (
      <div
        ref={ref}
        className={cn("relative inline-block", className)}
        {...props}
      >
        <span onClick={toggle}>{trigger}</span>
        {open && (
          <div
            className={cn(
              "bg-popover text-popover-foreground absolute z-10 mt-2 rounded-md border p-2 shadow-md",
              contentClassName
            )}
          >
            {children}
          </div>
        )}
      </div>
    );
  }
);
