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
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-md focus:bg-brand-primary focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 dark:focus:bg-brand-primary-dark dark:focus:text-black"
    >
      {children}
    </a>
  );
}
