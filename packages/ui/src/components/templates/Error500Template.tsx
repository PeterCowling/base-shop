"use client";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";

export interface Error500TemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** URL to navigate to when the user chooses to go back home. */
  homeHref?: string;
}

export function Error500Template({
  homeHref = "/",
  className,
  ...props
}: Error500TemplateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center space-y-4 py-20 text-center",
        className
      )}
      {...props}
    >
      <h1 className="text-6xl font-bold">500</h1>
      <p className="text-lg">Something went wrong</p>
      <Button onClick={() => (window.location.href = homeHref)}>Go home</Button>
    </div>
  );
}
