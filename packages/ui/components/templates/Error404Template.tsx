import * as React from "react";
import { cn } from "../../utils/cn";
import { Button } from "../atoms-shim";

export interface Error404TemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** URL to navigate to when the user chooses to go back home. */
  homeHref?: string;
}

export function Error404Template({
  homeHref = "/",
  className,
  ...props
}: Error404TemplateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center space-y-4 py-20 text-center",
        className
      )}
      {...props}
    >
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-lg">Page not found</p>
      <Button onClick={() => (window.location.href = homeHref)}>Go home</Button>
    </div>
  );
}
