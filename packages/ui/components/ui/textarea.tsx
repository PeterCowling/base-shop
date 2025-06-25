// packages/ui/components/ui/textarea.tsx
"use client";

import * as React from "react";
import { cn } from "../../utils/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[6rem] w-full rounded-md border px-3 py-2 text-sm " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
          "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900",
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";
