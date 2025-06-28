import * as React from "react";
import type { TextareaProps as BaseTextareaProps } from "../ui/textarea";
import { Textarea as BaseTextarea } from "../ui/textarea";

export type TextareaProps = BaseTextareaProps;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, wrapperClassName, ...props }, ref) => (
    <BaseTextarea
      ref={ref}
      className={className}
      wrapperClassName={wrapperClassName}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
