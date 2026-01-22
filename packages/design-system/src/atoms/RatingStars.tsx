import * as React from "react";

import { useTranslations } from "@acme/i18n";

import { cn } from "../utils/style";

export interface RatingStarsProps extends React.HTMLAttributes<HTMLDivElement> {
  rating: number; // 0-5
  size?: number;
}

export const RatingStars = React.forwardRef<HTMLDivElement, RatingStarsProps>(
  ({ rating, size = 16, className, "aria-label": ariaLabel, ...props }, ref) => {
    const t = useTranslations();
    const clamped = Math.max(0, Math.min(5, rating));
    const roundedToHalf = Math.round(clamped * 2) / 2;
    const wholeStars = Math.floor(roundedToHalf);
    const hasHalf = roundedToHalf - wholeStars === 0.5;
    const accessibleLabel =
      ariaLabel ??
      (t("rating.ariaLabel", { rating: roundedToHalf, max: 5 }) as string);

    const renderStar = (index: number) => {
      const variant =
        index < wholeStars ? "full" : index === wholeStars && hasHalf ? "half" : "empty";
      const basePath = (
        <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.786 1.4 8.173L12 18.902l-7.334 3.868 1.4-8.173L.132 9.211l8.2-1.193z" />
      );

      return (
        <svg
          key={index}
          aria-hidden="true"
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className="fill-muted" // i18n-exempt -- UI-2610: utility class string
        >
          {basePath}
          {(variant === "full" || variant === "half") && (
            <g
              className="fill-warning"
               
              style={
                variant === "half"
                  ? { clipPath: "inset(0 50% 0 0)" } // i18n-exempt -- UI-2610: CSS value for clip-path
                  : undefined
              }
            >
              {basePath}
            </g>
          )}
        </svg>
      );
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-0.5", className)} // i18n-exempt -- UI-2610: layout utility classes
        role="img"
        aria-label={accessibleLabel}
        {...props}
      >
        <span className="sr-only">{accessibleLabel}</span>
        {[0, 1, 2, 3, 4].map(renderStar)}
      </div>
    );
  }
);
RatingStars.displayName = "RatingStars";
