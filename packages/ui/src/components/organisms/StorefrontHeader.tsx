import * as React from "react";
import Link from "next/link";

import { cn } from "../../utils/style";
import { Cluster } from "../atoms/primitives/Cluster";
import { Inline } from "../atoms/primitives/Inline";
import { Stack } from "../atoms/primitives/Stack";

export interface StorefrontNavItem {
  label: string;
  href: string;
}

export interface StorefrontHeaderProps
  extends React.HTMLAttributes<HTMLElement> {
  brandName: string;
  nav: StorefrontNavItem[];
  utilities?: StorefrontNavItem[];
}

export function StorefrontHeader({
  brandName,
  nav,
  utilities = [],
  className,
  ...props
}: StorefrontHeaderProps) {
  // i18n-exempt -- XA-0002: class tokens only
  const HEADER_CLASS = "border-b bg-surface-1";
  return (
    <header className={cn(HEADER_CLASS, className)} {...props}>
      <div className="mx-auto px-4">
        <Cluster alignY="center" justify="between" className="min-h-16 gap-6">
          <Link
            href="/"
            className="inline-flex min-h-11 min-w-11 items-center font-semibold"
          >
            {brandName}
          </Link>

          <nav aria-label="Primary" className="hidden md:block">
            <Inline gap={6}>
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-11 min-w-11 items-center text-sm font-medium hover:underline"
                >
                  {item.label}
                </Link>
              ))}
            </Inline>
          </nav>

          <div className="min-w-0 flex-1 md:hidden" />

          <nav aria-label="Utilities">
            <Stack>
              <Inline gap={4}>
                {utilities.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex min-h-11 min-w-11 items-center text-sm hover:underline"
                  >
                    {item.label}
                  </Link>
                ))}
              </Inline>
            </Stack>
          </nav>
        </Cluster>
      </div>
    </header>
  );
}

