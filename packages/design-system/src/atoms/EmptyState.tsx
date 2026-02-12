"use client";

import * as React from "react";

import { cn } from "../utils/style";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = (
  {
    ref,
    icon,
    title,
    description,
    action,
    className,
    ...props
  }: EmptyStateProps & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-4", // i18n-exempt -- DS-13 CSS utility class names
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
};
