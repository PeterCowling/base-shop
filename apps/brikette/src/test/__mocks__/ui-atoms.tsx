// Mock for @acme/ui/atoms - avoids import.meta.env in buildCfImageUrl.ts
import React from "react";

export const Section = ({ children, as: Component = "section", ...props }: any) => (
  <Component {...props}>{children}</Component>
);

export const Grid = ({ as: Component = "div", children, ...props }: any) => {
  const { columns: _c, gap: _g, ...rest } = props;
  return <Component data-testid="grid" {...rest}>{children}</Component>;
};

export const AppLink = ({ children, href, ...props }: any) => (
  <a href={href} {...props}>{children}</a>
);

export const RatingsBar = ({ rating, ...props }: any) => (
  <div data-testid="ratings-bar" data-rating={rating} {...props} />
);

export const CfImage = ({ alt, src, priority: _priority, ...props }: any) => (
  <img data-testid="cf-image" alt={alt} src={src} {...props} />
);

export const CfCardImage = ({ alt, src, priority: _priority, ...props }: any) => (
  <img data-testid="cf-card-image" alt={alt} src={src} {...props} />
);

export const CfHeroImage = ({ alt, src, priority: _priority, ...props }: any) => (
  <img data-testid="cf-hero-image" alt={alt} src={src} {...props} />
);

export const CfResponsiveImage = ({ alt, src, priority: _priority, ...props }: any) => (
  <img data-testid="cf-responsive-image" alt={alt} src={src} {...props} />
);

export const Spinner = ({ label, ...props }: any) => (
  <div data-testid="spinner" aria-label={label} {...props} />
);

export const Badge = ({ children, ...props }: any) => (
  <span data-testid="badge" {...props}>{children}</span>
);
