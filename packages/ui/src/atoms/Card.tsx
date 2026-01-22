"use client";
/**
 * @deprecated Import Card, CardHeader, CardContent, CardFooter from "@acme/design-system/primitives" instead.
 * This shim exists for backward compatibility and will be removed in a future release.
 */

import {
  Card as DesignSystemCard,
  CardContent as DesignSystemCardContent,
  CardFooter as DesignSystemCardFooter,
  CardHeader as DesignSystemCardHeader,
} from "@acme/design-system/primitives";

// Warn once per session to avoid log spam
const WARN_KEY = "__acme_ui_card_deprecation_warned__";

function warnDeprecation(): void {
  if (process.env.NODE_ENV !== "development") return;
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") return;

  try {
    if (!sessionStorage.getItem(WARN_KEY)) {
      console.warn(
        "[@acme/ui] Card is deprecated. Import from @acme/design-system/primitives instead. " +
          "See docs/plans/ui-architecture-consolidation-plan.md for migration guidance."
      );
      sessionStorage.setItem(WARN_KEY, "1");
    }
  } catch {
    // Storage disabled or quota exceeded — ignore
  }
}

// Re-export design-system components with deprecation warning on first use
export type CardProps = React.HTMLAttributes<HTMLDivElement>;
export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;
export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;
export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

export const Card: React.FC<CardProps> = (props) => {
  warnDeprecation();
  return <DesignSystemCard {...props} />;
};

export const CardHeader: React.FC<CardHeaderProps> = (props) => {
  return <DesignSystemCardHeader {...props} />;
};

export const CardContent: React.FC<CardContentProps> = (props) => {
  return <DesignSystemCardContent {...props} />;
};

export const CardFooter: React.FC<CardFooterProps> = (props) => {
  return <DesignSystemCardFooter {...props} />;
};

// Support legacy Object.assign pattern: Card.Header, Card.Content, Card.Footer
export default Object.assign(Card, {
  Header: CardHeader,
  Content: CardContent,
  Footer: CardFooter,
});
