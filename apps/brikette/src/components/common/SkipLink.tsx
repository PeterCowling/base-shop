import React from "react";

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

/**
 * Skip link component for accessibility.
 * Hidden by default but visible when focused via keyboard.
 * Allows keyboard users to skip to main content or navigation.
 */
export function SkipLink({ href, children }: SkipLinkProps): React.JSX.Element {
  return (
    <a
      href={href}
      // eslint-disable-next-line ds/no-arbitrary-tailwind, ds/no-physical-direction-classes-in-rtl, ds/no-misused-sr-only -- CFL-99 pre-existing: skip link needs physical positioning and z-index for a11y
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-md focus:bg-brand-primary focus:px-4 focus:py-2 focus:text-fg-inverse focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-brand-primary focus-visible:focus:ring-offset-2"
    >
      {children}
    </a>
  );
}
