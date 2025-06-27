import * as React from "react";
import { cn } from "../../utils/cn";

export interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  textFallback?: string;
}

export const Logo = React.forwardRef<HTMLImageElement, LogoProps>(
  ({ className, src, alt, textFallback = "Logo", ...props }, ref) => {
    if (!src) {
      return <span className={cn("font-bold", className)}>{textFallback}</span>;
    }
    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={cn("h-8 w-auto", className)}
        {...props}
      />
    );
  }
);
Logo.displayName = "Logo";
